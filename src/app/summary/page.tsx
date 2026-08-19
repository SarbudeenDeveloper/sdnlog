import Link from "next/link";
import { getSummary } from "@/lib/entries";
import {
  todayStr,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  formatRangeDisplay,
} from "@/lib/dates";
import { formatDuration } from "@/lib/duration";

type RangeType = "week" | "month";

// Always render fresh: entries live in a local DB that changes at any time.
export const dynamic = "force-dynamic";

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; date?: string }>;
}) {
  const params = await searchParams;
  const range: RangeType = params.range === "month" ? "month" : "week";
  const anchor =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayStr();

  const start = range === "week" ? startOfWeek(anchor) : startOfMonth(anchor);
  const end = range === "week" ? endOfWeek(anchor) : endOfMonth(anchor);
  const summary = getSummary(start, end);

  const prevAnchor = addDays(start, -1);
  const nextAnchor = addDays(end, 1);

  const tabClass = (active: boolean) =>
    active
      ? "rounded-lg bg-navy px-3 py-1.5 font-medium text-white"
      : "rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Summary</h1>
        <p className="text-gray-500">Zoom out and see the bigger picture.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-sm">
          <Link href={`/summary?range=week&date=${anchor}`} className={tabClass(range === "week")}>
            Weekly
          </Link>
          <Link
            href={`/summary?range=month&date=${anchor}`}
            className={tabClass(range === "month")}
          >
            Monthly
          </Link>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/summary?range=${range}&date=${prevAnchor}`}
            className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
          >
            {"\u2190"} Prev
          </Link>
          <Link href={`/summary?range=${range}&date=${todayStr()}`} className="font-medium text-brand-dark hover:underline">
            Today
          </Link>
          <Link
            href={`/summary?range=${range}&date=${nextAnchor}`}
            className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
          >
            Next {"\u2192"}
          </Link>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-700">{formatRangeDisplay(start, end)}</h2>
        <div className="flex gap-8">
          <div>
            <p className="text-3xl font-semibold">{formatDuration(summary.totalMinutes)}</p>
            <p className="text-sm text-gray-500">logged</p>
          </div>
          <div>
            <p className="text-3xl font-semibold">{summary.taskCount}</p>
            <p className="text-sm text-gray-500">
              {summary.taskCount === 1 ? "task" : "tasks"} completed
            </p>
          </div>
        </div>

        {summary.byProject.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">Main work</p>
            <div className="space-y-2">
              {summary.byProject.map((p) => (
                <div key={p.project} className="flex items-center justify-between text-sm">
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 font-medium text-brand-dark">
                    {p.project}
                  </span>
                  <span className="text-gray-500">
                    {formatDuration(p.minutes)} {"\u00b7"} {p.count}{" "}
                    {p.count === 1 ? "task" : "tasks"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.taskCount === 0 && (
          <p className="text-sm text-gray-400">Nothing logged in this period yet.</p>
        )}
      </div>
    </div>
  );
}
