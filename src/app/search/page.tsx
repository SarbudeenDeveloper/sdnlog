import Link from "next/link";
import { searchEntries } from "@/lib/entries";
import { formatDuration } from "@/lib/duration";
import { formatDisplayDate } from "@/lib/dates";
import SearchBox from "@/components/SearchBox";

// Always render fresh: entries live in a local DB that changes at any time.
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const results = q ? searchEntries(q) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Search</h1>
        <p className="text-gray-500">Find anything you&apos;ve worked on.</p>
      </div>

      <SearchBox initialQuery={q} />

      {q && (
        <p className="text-sm text-gray-500">
          {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </p>
      )}

      <div className="space-y-2">
        {results.map((entry) => (
          <Link
            key={entry.id}
            href={`/history?date=${entry.date}`}
            className="block rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            <p className="whitespace-pre-wrap text-gray-900">{entry.description}</p>
            {entry.details && (
              <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-gray-500">
                {entry.details}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formatDisplayDate(entry.date)} {"\u00b7"} {formatDuration(entry.durationMinutes)}
              {entry.project && (
                <>
                  {" \u00b7 "}
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 font-medium text-brand-dark">
                    {entry.project}
                  </span>
                </>
              )}
            </p>
          </Link>
        ))}
        {q && results.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
            No entries match &ldquo;{q}&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}
