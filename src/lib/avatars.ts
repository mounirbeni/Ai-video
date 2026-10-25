export const AVATARS = [
  { id: "orbit", key: "avatar.orbit", column: 0, row: 0 },
  { id: "nova", key: "avatar.nova", column: 1, row: 0 },
  { id: "ember", key: "avatar.ember", column: 2, row: 0 },
  { id: "luna", key: "avatar.luna", column: 3, row: 0 },
  { id: "storm", key: "avatar.storm", column: 4, row: 0 },
  { id: "jade", key: "avatar.jade", column: 0, row: 1 },
  { id: "echo", key: "avatar.echo", column: 1, row: 1 },
  { id: "pixel", key: "avatar.pixel", column: 2, row: 1 },
  { id: "sol", key: "avatar.sol", column: 3, row: 1 },
  { id: "vela", key: "avatar.vela", column: 4, row: 1 },
] as const;

export const ADMIN_AVATAR = { id: "sovereign", key: "avatar.sovereign", image: "/avatars/admin-sovereign.webp" } as const;
export type AvatarId = (typeof AVATARS)[number]["id"] | typeof ADMIN_AVATAR.id;
export const AVATAR_ATLAS = "/avatars/nexora-atlas.webp";
export const getAvailableAvatars = (role = "USER") => role === "ADMIN" ? [...AVATARS, ADMIN_AVATAR] : [...AVATARS];
export const getAvatar = (id: string | null | undefined, role = "USER") => getAvailableAvatars(role).find((a) => a.id === id);
export const isAvatarId = (value: unknown, role = "USER"): value is AvatarId => typeof value === "string" && !!getAvatar(value, role);
