"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

interface EntryFormInitial {
  description: string;
  details: string;
  durationText: string;
  project: string;
}

interface EntryFormProps {
  action: (formData: FormData) => Promise<void>;
  date: string;
  projects: string[];
  initial?: EntryFormInitial;
  onCancel?: () => void;
  submitLabel?: string;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-shadow " +
  "focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand";

const labelClass = "mb-1 block text-xs font-medium text-gray-500";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:opacity-50"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export default function EntryForm({
  action,
  date,
  projects,
  initial,
  onCancel,
  submitLabel = "Save",
}: EntryFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(formData: FormData) {
    setError(null);
    try {
      await action(formData);
      formRef.current?.reset();
      onCancel?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form ref={formRef} action={handleAction} className="space-y-3">
      <input type="hidden" name="date" value={date} />
      <div>
        <label htmlFor="entry-description" className={labelClass}>
          What did you work on?
        </label>
        <textarea
          id="entry-description"
          name="description"
          required
          defaultValue={initial?.description}
          placeholder="e.g. Fixed a login bug"
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>
      <div>
        <label htmlFor="entry-details" className={labelClass}>
          Description <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="entry-details"
          name="details"
          defaultValue={initial?.details}
          placeholder="Add more details — context, links, follow-ups…"
          rows={2}
          className={`${inputClass} resize-y`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="entry-duration" className={labelClass}>
            How long?
          </label>
          <input
            id="entry-duration"
            name="duration"
            required
            defaultValue={initial?.durationText}
            placeholder="e.g. 1h 30m"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="entry-project" className={labelClass}>
            Project <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="entry-project"
            name="project"
            list="project-suggestions"
            defaultValue={initial?.project}
            placeholder="e.g. Website Redesign"
            className={inputClass}
          />
          <datalist id="project-suggestions">
            {projects.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <div className="flex gap-2">
        <SubmitButton label={submitLabel} />
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
