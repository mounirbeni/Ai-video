export function validProgress(input: unknown): input is { key: string; seconds: number; completed?: boolean } {
  if (!input || typeof input !== "object") return false;
  const p = input as Record<string, unknown>;
  return typeof p.key === "string" && p.key.length > 0 && p.key.length <= 100 &&
    typeof p.seconds === "number" && Number.isFinite(p.seconds) && p.seconds >= 0 && p.seconds <= 7 * 86400 &&
    (p.completed === undefined || typeof p.completed === "boolean");
}
