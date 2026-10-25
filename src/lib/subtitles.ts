export type Subtitle = { language: string; label: string; src: string };

export function readSubtitles(value: unknown): Subtitle[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is Subtitle => {
    if (!v || typeof v !== "object") return false;
    const s = v as Record<string, unknown>;
    if (typeof s.language !== "string" || !/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i.test(s.language) ||
      typeof s.label !== "string" || !s.label.trim() || s.label.length > 60 || typeof s.src !== "string") return false;
    try { const url = new URL(s.src); return url.protocol === "https:" && !url.username && !url.password && url.pathname.endsWith(".vtt"); } catch { return false; }
  }).slice(0, 20);
}

export function parseSubtitles(text: string): Subtitle[] {
  if (!text.trim()) return [];
  const rows = text.trim().split("\n").map((line) => {
    const [language, label, src, ...extra] = line.split("|").map((s) => s.trim());
    if (extra.length) throw new Error("Invalid subtitle format");
    return { language, label, src };
  });
  const valid = readSubtitles(rows);
  if (valid.length !== rows.length) throw new Error("Invalid subtitle format: use language | label | HTTPS .vtt URL");
  return valid;
}

export function formatSubtitles(value: unknown) {
  return readSubtitles(value).map((s) => `${s.language} | ${s.label} | ${s.src}`).join("\n");
}
