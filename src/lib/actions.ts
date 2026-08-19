"use server";

import { revalidatePath } from "next/cache";
import * as entries from "./entries";
import { parseDuration } from "./duration";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/search");
  revalidatePath("/summary");
}

function readEntryInput(formData: FormData) {
  const date = String(formData.get("date") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim() || null;
  const durationText = String(formData.get("duration") ?? "").trim();
  const project = String(formData.get("project") ?? "").trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("A valid date is required.");
  }
  if (!description) {
    throw new Error("Please describe what you worked on.");
  }
  const durationMinutes = parseDuration(durationText);
  if (!durationMinutes) {
    throw new Error('Enter a valid duration, e.g. "1h 30m" or "45m".');
  }

  return { date, description, details, durationMinutes, project };
}

export async function addEntry(formData: FormData) {
  const input = readEntryInput(formData);
  entries.createEntry(input);
  revalidateAll();
}

export async function updateEntry(id: number, formData: FormData) {
  const input = readEntryInput(formData);
  entries.updateEntry(id, input);
  revalidateAll();
}

export async function deleteEntry(id: number) {
  entries.deleteEntry(id);
  revalidateAll();
}
