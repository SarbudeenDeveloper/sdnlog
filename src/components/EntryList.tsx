import EntryRow from "./EntryRow";
import type { Entry } from "@/lib/types";

export default function EntryList({
  entries,
  projects,
}: {
  entries: Entry[];
  projects: string[];
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white/60 p-8 text-center">
        <p className="text-sm font-medium text-gray-500">Nothing logged yet</p>
        <p className="mt-1 text-sm text-gray-400">
          Jot down what you worked on — future you will thank you.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} projects={projects} />
      ))}
    </div>
  );
}
