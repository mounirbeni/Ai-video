import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ cookies: new Map<string, string>() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (key: string) => state.cookies.has(key) ? { value: state.cookies.get(key) } : undefined, set: (key: string, value: string) => state.cookies.set(key, value), delete: (key: string) => state.cookies.delete(key) }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
import { db } from "../src/lib/db";
import { createSession, getUser } from "../src/lib/auth";
import { getCommunityFeed, getCommunityPost, getCommunityPublisher } from "../src/lib/community";
import { saveCommunityPost, deleteCommunityPost } from "../src/app/actions/community";

const enabled = !!process.env.TEST_DATABASE_URL;
describe.skipIf(!enabled)("two-publisher community", () => {
  let ownerId: string, devId: string, viewerId: string, otherAdminId: string;
  const testUsers = { OR: [{ email: { endsWith: "@nexora.test" } }, { email: "mobanunir@gmail.com" }] };
  async function clear() { await db.communityPost.deleteMany({ where: { author: testUsers } }); await db.user.deleteMany({ where: testUsers }); await db.rateLimit.deleteMany(); }
  async function as(id: string) { await createSession(id); return (await getUser())!; }
  function form(overrides: Record<string, string> = {}) { const f = new FormData(); for (const [k,v] of Object.entries({ title: "Nexora community update", body: "A real update for the members of the Nexora community.", category: "updates", published: "on", ...overrides })) f.set(k,v); return f; }
  async function create(overrides: Record<string, string> = {}) {
    await expect(saveCommunityPost(undefined, form(overrides))).rejects.toThrow("REDIRECT:/community/");
    return db.communityPost.findFirstOrThrow({ orderBy: { createdAt: "desc" } });
  }
  beforeAll(async () => { process.env.AUTH_SECRET = "test-only-secret-with-at-least-32-characters"; await db.$connect(); });
  beforeEach(async () => {
    vi.stubEnv("ADMIN_EMAIL", "owner@nexora.test"); state.cookies.clear(); await clear();
    const [owner,dev,viewer,other] = await Promise.all([
      db.user.create({ data: { email: "owner@nexora.test", name: "Owner", role: "ADMIN", passwordHash: "unused" } }),
      db.user.create({ data: { email: "mobanunir@gmail.com", name: "Developer", emailVerified: new Date(), passwordHash: "unused" } }),
      db.user.create({ data: { email: "reader@nexora.test", name: "Reader", passwordHash: "unused" } }),
      db.user.create({ data: { email: "extra-admin@nexora.test", name: "Extra admin", role: "ADMIN", passwordHash: "unused" } }),
    ]);
    ownerId=owner.id; devId=dev.id; viewerId=viewer.id; otherAdminId=other.id;
  });
  afterAll(async () => { await clear(); vi.unstubAllEnvs(); await db.$disconnect(); });

  it("reserves the two seats for the configured owner and verified developer", async () => {
    expect(await getCommunityPublisher(await as(ownerId))).toBe("admin");
    expect(await getCommunityPublisher(await as(devId))).toBe("developer");
    for (const id of [viewerId, otherAdminId]) {
      expect(await getCommunityPublisher(await as(id))).toBeNull();
      expect(await saveCommunityPost(undefined, form({ role: "ADMIN", email: "mobanunir@gmail.com", authorId: ownerId }))).toHaveProperty("error");
    }
    expect(await db.communityPost.count()).toBe(0);
    vi.stubEnv("ADMIN_EMAIL", "");
    expect(await getCommunityPublisher(await as(ownerId))).toBeNull(); // two admins cannot pick an arbitrary owner
    await db.user.delete({ where: { id: otherAdminId } });
    expect(await getCommunityPublisher(await as(ownerId))).toBe("admin");
  });

  it("assigns authors from the session and lets both publishers edit while preserving attribution", async () => {
    await as(devId); const post = await create({ authorId: ownerId, pinned: "on" });
    expect(post.authorId).toBe(devId); expect(post.pinned).toBe(true);
    await as(ownerId);
    await expect(saveCommunityPost(undefined, form({ id: post.id, version: "0", authorId: ownerId, title: "Updated by the owner" }))).rejects.toThrow(`REDIRECT:/community/${post.id}`);
    const saved = await db.communityPost.findUniqueOrThrow({ where: { id: post.id } });
    expect(saved.authorId).toBe(devId); expect(saved.version).toBe(1); expect(saved.title).toBe("Updated by the owner");
    expect(await saveCommunityPost(undefined, form({ id: post.id, version: "0", title: "Stale overwrite attempt" }))).toHaveProperty("error");
    expect((await db.communityPost.findUniqueOrThrow({ where: { id: post.id } })).title).toBe("Updated by the owner");
  });

  it("hides private drafts from members, extra admins, anonymous readers and guessed URLs", async () => {
    const owner = await as(ownerId); const draft = await create({ published: "", pinned: "on" });
    expect(draft.published).toBe(false); expect(draft.pinned).toBe(false);
    expect((await getCommunityFeed(owner, { view: "manage" })).posts).toHaveLength(1);
    expect(await getCommunityPost(owner, draft.id)).not.toBeNull();
    for (const id of [viewerId,otherAdminId]) {
      const user=await as(id); const feed=await getCommunityFeed(user,{view:"manage"});
      expect(feed.manage).toBe(false); expect(feed.posts).toHaveLength(0);
      expect(await getCommunityPost(user,draft.id)).toBeNull();
      expect(await saveCommunityPost(undefined,form({id:draft.id,version:"0"}))).toHaveProperty("error");
      expect(await deleteCommunityPost(undefined,form({id:draft.id,version:"0",confirm:"delete"}))).toHaveProperty("error");
    }
    expect(await getCommunityPost(null,draft.id)).toBeNull();
    state.cookies.clear(); await expect(saveCommunityPost(undefined,form())).rejects.toThrow("REDIRECT:/login");
  });

  it("publishes and unpublishes immediately for readers and honors category, pinned order and pagination", async () => {
    await as(ownerId);
    await db.communityPost.createMany({ data: Array.from({length:22},(_,i)=>({authorId:ownerId,title:`Member news ${i}`,body:"A sufficiently long news item for our members.",category:i===0?"news":"updates",published:true,pinned:i===0,createdAt:new Date(Date.UTC(2026,0,1,0,i))})) });
    const reader=await as(viewerId); const first=await getCommunityFeed(reader,{});
    expect(first.posts).toHaveLength(20); expect(first.hasNext).toBe(true); expect(first.posts[0].pinned).toBe(true);
    const next=await getCommunityFeed(reader,{page:"2"}); expect(next.posts).toHaveLength(2); expect(next.hasNext).toBe(false);
    expect(new Set([...first.posts,...next.posts].map(p=>p.id)).size).toBe(22);
    expect((await getCommunityFeed(reader,{category:"news"})).posts).toHaveLength(1);
    expect((await getCommunityFeed(reader,{page:"-4",category:"bad"})).page).toBe(1);
    const post=first.posts[0]; await as(ownerId);
    await expect(saveCommunityPost(undefined,form({id:post.id,version:String(post.version),published:"",category:"news"}))).rejects.toThrow("REDIRECT:/community/");
    expect(await getCommunityPost(await as(viewerId),post.id)).toBeNull();
  });

  it("requires confirmation and the current version to delete a post", async () => {
    await as(ownerId); const post=await create(); const del=form({id:post.id,version:"0"});
    expect(await deleteCommunityPost(undefined,del)).toHaveProperty("error");
    del.set("confirm","delete");del.set("version","1");expect(await deleteCommunityPost(undefined,del)).toHaveProperty("error");
    del.set("version","0"); await as(devId);
    await expect(deleteCommunityPost(undefined,del)).rejects.toThrow("REDIRECT:/community?view=manage&deleted=1");
    expect(await db.communityPost.findUnique({where:{id:post.id}})).toBeNull();
  });

  it("revokes developer publishing when verification is removed and validates/rate-limits mutations", async () => {
    await as(devId); await db.user.update({where:{id:devId},data:{emailVerified:null}});
    expect(await saveCommunityPost(undefined,form())).toHaveProperty("error");
    await as(ownerId);
    const invalidForms: Record<string,string>[] = [{title:"a"},{body:"too short"},{category:"invalid"},{title:"a".repeat(141)},{body:"a".repeat(12001)},{id:"bad",version:"0"}];
    for(const bad of invalidForms) expect(await saveCommunityPost(undefined,form(bad))).toHaveProperty("error");
    expect(await db.communityPost.count()).toBe(0);
    const {consumeLimit}=await import("../src/lib/rate-limit");
    for(let i=0;i<30;i++) await consumeLimit("community-write",ownerId,30,60);
    expect(await saveCommunityPost(undefined,form())).toHaveProperty("error");
    expect(await db.communityPost.count()).toBe(0);
  });
});
