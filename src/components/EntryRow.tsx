"use client";

import { useEffect, useState } from "react";
import EntryForm from "./EntryForm";
import { updateEntry, deleteEntry } from "@/lib/actions";
import { formatDuration } from "@/lib/duration";
import { formatDisplayDate } from "@/lib/dates";
import type { Entry } from "@/lib/types";

function ProjectPill({ name }: { name: string }) {
  return (
    <span className="rounded-full bg-brand/10 px-2 py-0.5 font-medium text-brand-dark">
      {name}
    </span>
  );
}

function PreviewCard({
  entry,
  onClose,
  onEdit,
  onDelete,
  deleting,
}: {
  entry: Entry;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Entry details"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
          <div className="text-xs text-gray-500">
            <p className="font-medium text-gray-600">{formatDisplayDate(entry.date)}</p>
            <p className="mt-0.5">
              <span className="font-medium text-gray-600">
                {formatDuration(entry.durationMinutes)}
              </span>
              {entry.project && (
                <>
                  {" · "}
                  <ProjectPill name={entry.project} />
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
          <p className="whitespace-pre-wrap font-medium text-gray-900">{entry.description}</p>
          {entry.details ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
              {entry.details}
            </p>
          ) : (
            <p className="mt-2 text-sm italic text-gray-400">No description added.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            onClick={onEdit}
            className="rounded-lg bg-navy px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-navy-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-3.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EntryRow({ entry, projects }: { entry: Entry; projects: string[] }) {
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    setDeleting(true);
    try {
      await deleteEntry(entry.id);
      setPreview(false);
    } catch {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <EntryForm
          action={updateEntry.bind(null, entry.id)}
          date={entry.date}
          projects={projects}
          initial={{
            description: entry.description,
            details: entry.details ?? "",
            durationText: formatDuration(entry.durationMinutes),
            project: entry.project ?? "",
          }}
          onCancel={() => setEditing(false)}
          submitLabel="Update"
        />
      </div>
    );
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setPreview(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setPreview(true);
          }
        }}
        className="group flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
      >
        <div className="min-w-0">
          <p className="truncate text-gray-900">{entry.description}</p>
          {entry.details && (
            <p className="mt-0.5 truncate text-sm text-gray-400">{entry.details}</p>
          )}
          <p className="mt-1.5 text-xs text-gray-500">
            <span className="font-medium text-gray-600">
              {formatDuration(entry.durationMinutes)}
            </span>
            {entry.project && (
              <>
                {" · "}
                <ProjectPill name={entry.project} />
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-3 text-xs opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="text-gray-500 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={deleting}
            className="text-red-500 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
      {preview && (
        <PreviewCard
          entry={entry}
          onClose={() => setPreview(false)}
          onEdit={() => {
            setPreview(false);
            setEditing(true);
          }}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}
    </>
  );
}
