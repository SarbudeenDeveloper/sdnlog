/**
 * Parses free-form duration text like "1h 30m", "1.5h", "90m" or "45" into minutes.
 * Returns null if the text can't be understood or resolves to zero/negative.
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const n = parseFloat(trimmed);
    return n > 0 ? Math.round(n) : null;
  }

  let totalMinutes = 0;
  let matched = false;

  const hourMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*h(?:ours?|rs?|r)?\b/);
  if (hourMatch) {
    totalMinutes += parseFloat(hourMatch[1]) * 60;
    matched = true;
  }

  const minMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?\b/);
  if (minMatch) {
    totalMinutes += parseFloat(minMatch[1]);
    matched = true;
  }

  if (!matched) return null;
  const rounded = Math.round(totalMinutes);
  return rounded > 0 ? rounded : null;
}

/** Formats minutes as a short human string, e.g. 90 -> "1h 30m". */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
