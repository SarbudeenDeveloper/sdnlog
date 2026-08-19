import { getEntriesByDate, listDistinctProjects } from "@/lib/entries";
import { todayStr, addDays, formatDisplayDate } from "@/lib/dates";
import { formatDuration } from "@/lib/duration";
import EntryList from "@/components/EntryList";
import DateNav from "@/components/DateNav";

// Always render fresh: entries live in a local DB that changes at any time.
export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayStr();
  const entries = getEntriesByDate(date);
  const projects = listDistinctProjects();
  const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-gray-500">Look back at any day.</p>
      </div>

      <DateNav date={date} prev={addDays(date, -1)} next={addDays(date, 1)} today={todayStr()} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">{formatDisplayDate(date)}</h2>
          {entries.length > 0 && (
            <span className="text-sm text-gray-500">
              {formatDuration(totalMinutes)} {"\u00b7"} {entries.length}{" "}
              {entries.length === 1 ? "task" : "tasks"}
            </span>
          )}
        </div>
        <EntryList entries={entries} projects={projects} />
      </div>
    </div>
  );
}
