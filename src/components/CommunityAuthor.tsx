import type { CommunityPostWithAuthor } from "@/lib/community";
import { getAccountIdentity } from "@/lib/account-identity";
import { identityLabelKey } from "@/lib/identity";
import { getT } from "@/lib/i18n/server";
import UserAvatar from "./UserAvatar";
import IdentityBadge from "./IdentityBadge";

export default async function CommunityAuthor({ author, date }: { author: CommunityPostWithAuthor["author"]; date: Date }) {
  const t = await getT();
  const identity = getAccountIdentity(author);
  return <div className="flex min-w-0 items-center gap-3">
    <UserAvatar avatarId={author.avatarId} role={author.role} identity={identity} name={author.name} label={author.name} className="h-11 w-11" />
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="max-w-48 truncate text-sm font-semibold" dir="auto">{author.name}</span>{identity && <IdentityBadge identity={identity} label={t(identityLabelKey(identity))} />}</div><time dateTime={date.toISOString()} title={new Intl.DateTimeFormat(t.locale, { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }).format(date)} className="mt-1 block text-xs text-neutral-400">{new Intl.DateTimeFormat(t.locale, { dateStyle: "medium", timeZone: "UTC" }).format(date)}</time></div>
  </div>;
}
