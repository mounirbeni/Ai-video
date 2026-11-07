// Helpers for link previews (Open Graph / Twitter cards) and the share button.

export function siteUrl() {
  const raw =
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    "http://localhost:3000";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:3000";
  }
}

// Crawlers need absolute image URLs; stored paths are usually site-relative.
export function absoluteUrl(path: string | null | undefined) {
  if (!path) return undefined;
  try {
    return new URL(path, siteUrl()).toString();
  } catch {
    return undefined;
  }
}

// Social cards show roughly 200 characters; cut at a word boundary and collapse whitespace.
export function summarize(text: string, max = 200) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6))}…`;
}
