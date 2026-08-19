"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DateNav({
  date,
  prev,
  next,
  today,
}: {
  date: string;
  prev: string;
  next: string;
  today: string;
}) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/history?date=${prev}`}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        {"\u2190"} Prev
      </Link>
      <input
        type="date"
        value={date}
        onChange={(e) => e.target.value && router.push(`/history?date=${e.target.value}`)}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
      />
      <Link
        href={`/history?date=${next}`}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Next {"\u2192"}
      </Link>
      {date !== today && (
        <Link href={`/history?date=${today}`} className="text-sm font-medium text-brand-dark hover:underline">
          Today
        </Link>
      )}
    </div>
  );
}
