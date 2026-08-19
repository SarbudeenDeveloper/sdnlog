import db from "./db";
import type { Entry, EntryInput, Summary } from "./types";

interface EntryRow {
  id: number;
  date: string;
  description: string;
  details: string | null;
  duration_minutes: number;
  project: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    details: row.details,
    durationMinutes: row.duration_minutes,
    project: row.project,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createEntry(input: EntryInput): Entry {
  const result = db
    .prepare(
      `INSERT INTO entries (date, description, details, duration_minutes, project)
       VALUES (@date, @description, @details, @durationMinutes, @project)`
    )
    .run(input);
  return getEntryById(Number(result.lastInsertRowid))!;
}

export function updateEntry(id: number, input: EntryInput): Entry | undefined {
  db.prepare(
    `UPDATE entries
     SET date = @date, description = @description, details = @details,
         duration_minutes = @durationMinutes, project = @project, updated_at = datetime('now')
     WHERE id = @id`
  ).run({ ...input, id });
  return getEntryById(id);
}

export function deleteEntry(id: number): void {
  db.prepare(`DELETE FROM entries WHERE id = ?`).run(id);
}

export function getEntryById(id: number): Entry | undefined {
  const row = db.prepare(`SELECT * FROM entries WHERE id = ?`).get(id) as EntryRow | undefined;
  return row ? rowToEntry(row) : undefined;
}

export function getEntriesByDate(date: string): Entry[] {
  const rows = db
    .prepare(`SELECT * FROM entries WHERE date = ? ORDER BY created_at ASC`)
    .all(date) as EntryRow[];
  return rows.map(rowToEntry);
}

export function searchEntries(query: string): Entry[] {
  // Escape SQLite LIKE wildcards so a search for e.g. "50%" behaves literally.
  const escaped = query.replace(/[\\%_]/g, (c) => `\\${c}`);
  const like = `%${escaped}%`;
  const rows = db
    .prepare(
      `SELECT * FROM entries
       WHERE description LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR details LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR project LIKE ? ESCAPE '\\' COLLATE NOCASE
       ORDER BY date DESC, created_at DESC`
    )
    .all(like, like, like) as EntryRow[];
  return rows.map(rowToEntry);
}

export function getSummary(start: string, end: string): Summary {
  const totals = db
    .prepare(
      `SELECT COALESCE(SUM(duration_minutes), 0) as totalMinutes, COUNT(*) as taskCount
       FROM entries WHERE date BETWEEN ? AND ?`
    )
    .get(start, end) as { totalMinutes: number; taskCount: number };

  const byProject = db
    .prepare(
      `SELECT COALESCE(NULLIF(project, ''), '(No project)') as project,
              SUM(duration_minutes) as minutes, COUNT(*) as count
       FROM entries WHERE date BETWEEN ? AND ?
       GROUP BY project ORDER BY minutes DESC`
    )
    .all(start, end) as { project: string; minutes: number; count: number }[];

  return { totalMinutes: totals.totalMinutes, taskCount: totals.taskCount, byProject };
}

export function listDistinctProjects(): string[] {
  const rows = db
    .prepare(
      `SELECT DISTINCT project FROM entries
       WHERE project IS NOT NULL AND project != ''
       ORDER BY project COLLATE NOCASE`
    )
    .all() as { project: string }[];
  return rows.map((r) => r.project);
}
