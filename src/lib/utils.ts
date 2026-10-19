export function slugify(s: string) {
  const slug = s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "title"}-${Math.random().toString(36).slice(2, 6)}`;
}

export function genresList(g: string) {
  return g.split(",").map((x) => x.trim()).filter(Boolean);
}
