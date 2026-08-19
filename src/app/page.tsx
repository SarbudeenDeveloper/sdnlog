import { getEntriesByDate, listDistinctProjects } from "@/lib/entries";
import { todayStr, formatDisplayDate } from "@/lib/dates";
import { formatDuration } from "@/lib/duration";
import { addEntry } from "@/lib/actions";
import EntryForm from "@/components/EntryForm";
import EntryList from "@/components/EntryList";

// Always render fresh: "today" and its entries change over time and aren't static.
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const date = todayStr();
  const entries = getEntriesByDate(date);
  const projects = listDistinctProjects();
  const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Today</h1>
        <p className="text-gray-500">{formatDisplayDate(date)}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <EntryForm action={addEntry} date={date} projects={projects} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">What you&apos;ve logged today</h2>
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
