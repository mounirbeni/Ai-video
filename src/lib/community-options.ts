export const COMMUNITY_CATEGORIES = ["news", "updates", "behindScenes"] as const;
export type CommunityCategory = typeof COMMUNITY_CATEGORIES[number];
export const isCommunityCategory = (value: unknown): value is CommunityCategory => COMMUNITY_CATEGORIES.some((c) => c === value);
