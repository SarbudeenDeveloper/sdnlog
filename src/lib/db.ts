import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";

// Node's built-in SQLite (Node 22+). No native npm module: installs never
// need node-gyp, Python, or platform-specific prebuilt binaries.

// Reuse a single connection across hot reloads in development.
declare global {
  var __journalDb: DatabaseSync | undefined;
}

function openDb(): DatabaseSync {
  if (global.__journalDb) return global.__journalDb;

  // SDNLOG_DATA_DIR lets installs keep the database outside the app checkout,
  // so `git pull` updates can never touch user data. Defaults to ./data.
  const dataDir = process.env.SDNLOG_DATA_DIR
    ? path.resolve(process.env.SDNLOG_DATA_DIR)
    : path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new DatabaseSync(path.join(dataDir, "journal.db"));

  // Set busy_timeout before any lock-taking pragma so concurrent opens
  // (e.g. several processes) wait instead of throwing SQLITE_BUSY.
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      project TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
    CREATE INDEX IF NOT EXISTS idx_entries_project ON entries(project);
  `);

  // Migration: optional free-form details for an entry (added after initial schema).
  const columns = db
    .prepare(`SELECT name FROM pragma_table_info('entries')`)
    .all() as { name: string }[];
  if (!columns.some((c) => c.name === "details")) {
    db.exec(`ALTER TABLE entries ADD COLUMN details TEXT`);
  }

  global.__journalDb = db;
  return db;
}

// Open lazily on first query, not at import time: `next build` evaluates these
// modules in many parallel workers, and eager opens made them race on the WAL
// pragma and schema creation (SQLITE_BUSY). The Proxy keeps the `db.prepare(...)`
// call sites unchanged.
const db = new Proxy({} as DatabaseSync, {
  get(_target, prop) {
    const real = openDb();
    const value = real[prop as keyof DatabaseSync];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
});

export default db;
