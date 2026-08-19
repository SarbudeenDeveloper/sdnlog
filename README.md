# SDNLog — "Your work memory"

A tiny personal work journal for remembering what you actually did. Log quick
entries like *"Fixed Facebook OAuth redirect issue — 1h 30m"*, tag them with a
project, and later search or review your history by day, week, or month.

Built with Next.js (App Router) and SQLite (via `better-sqlite3`) — all of
your data stays local, on your machine.

## Quick start — one command

> Requires [Node.js 20+](https://nodejs.org) and git.

```bash
curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/main/install.sh | bash
```

That's it. The script installs SDNLog into `~/.sdnlog`, builds it, starts it,
and opens **http://localhost:3456** in your browser.

**Re-run the same command anytime** — it checks for updates, applies them, and
(re)starts the app. Your journal data is kept in `~/.sdnlog/data`, outside the
app itself, so updates never touch it.

Manage the app after installing:

```bash
bash ~/.sdnlog/app/install.sh status     # is it running?
bash ~/.sdnlog/app/install.sh stop       # stop it
bash ~/.sdnlog/app/install.sh logs       # follow server logs
bash ~/.sdnlog/app/install.sh uninstall  # remove the app (keeps your data)
```

Options via environment variables: `SDNLOG_PORT` (default `3456`),
`SDNLOG_HOME` (default `~/.sdnlog`), `SDNLOG_DATA_DIR`, `SDNLOG_NO_OPEN=1`.

## Features

- **Today** — a fast, note-like form to log what you worked on (task, an
  optional longer description, duration like `1h 30m` or `45m`, optional
  project).
- **History** — jump to any date and see exactly what you worked on.
- **Search** — find entries by keyword (task, description, or project).
- **Summary** — weekly/monthly totals: hours logged, tasks completed, and a
  breakdown by project.
- **Edit / Delete** — inline editing and deletion for any entry.

## Developing from source

```bash
git clone https://github.com/OWNER/REPO.git
cd REPO
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start journaling. The
SQLite database is created automatically at `data/journal.db` on first run
(or at `$SDNLOG_DATA_DIR` if that variable is set).

## Project structure

- `src/lib/db.ts` — SQLite connection + schema migration.
- `src/lib/entries.ts` — data access functions (create/update/delete/search/summary).
- `src/lib/actions.ts` — Next.js Server Actions used by forms to mutate entries.
- `src/lib/duration.ts` — parses free-form durations like `1h 30m` into minutes.
- `src/lib/dates.ts` — date helpers (week/month ranges, formatting).
- `src/app/*` — Today, History, Search, and Summary pages.
- `src/components/*` — entry form/list/row, nav bar, date picker, search box.
- `install.sh` — one-command installer/updater/launcher (see Quick start).

## License

[MIT](LICENSE)

