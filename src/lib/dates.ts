function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Formats a Date using local time as YYYY-MM-DD (avoids UTC off-by-one issues). */
export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return formatDate(new Date());
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, delta: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + delta);
  return formatDate(d);
}

/** Monday-based start of the week containing the given date. */
export function startOfWeek(s: string): string {
  const d = parseDate(s);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

export function endOfWeek(s: string): string {
  return addDays(startOfWeek(s), 6);
}

export function startOfMonth(s: string): string {
  const d = parseDate(s);
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(s: string): string {
  const d = parseDate(s);
  return formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function formatDisplayDate(s: string): string {
  const d = parseDate(s);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRangeDisplay(start: string, end: string): string {
  const s = parseDate(start);
  const e = parseDate(end);
  const monthOf = (d: Date) => d.toLocaleDateString(undefined, { month: "long" });
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const sameYear = s.getFullYear() === e.getFullYear();

  if (sameMonth) {
    return `${monthOf(s)} ${s.getDate()}\u2013${e.getDate()}, ${e.getFullYear()}`;
  }
  if (sameYear) {
    return `${monthOf(s)} ${s.getDate()} \u2013 ${monthOf(e)} ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${monthOf(s)} ${s.getDate()}, ${s.getFullYear()} \u2013 ${monthOf(e)} ${e.getDate()}, ${e.getFullYear()}`;
}
