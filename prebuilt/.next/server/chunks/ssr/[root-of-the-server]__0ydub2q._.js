module.exports=[85148,(a,b,c)=>{b.exports=a.x("better-sqlite3-90e2652d1716b047",()=>require("better-sqlite3-90e2652d1716b047"))},22734,(a,b,c)=>{b.exports=a.x("fs",()=>require("fs"))},56582,a=>{"use strict";var b=a.i(94495);a.s([],56794),a.i(56794),a.s(["40a384e53220b91d7724f9ab7f49afded40d5b6fd4",()=>b.deleteEntry,"6069b4c6889746ef7daccd8962036953e47f1c653a",()=>b.updateEntry],56582)},51476,12798,a=>{"use strict";var b=a.i(85148),c=a.i(22734),d=a.i(14747);let e=new Proxy({},{get(e,f){let g=function(){if(a.g.__journalDb)return a.g.__journalDb;let e=process.env.SDNLOG_DATA_DIR?d.default.resolve(process.env.SDNLOG_DATA_DIR):d.default.join(process.cwd(),"data");c.default.existsSync(e)||c.default.mkdirSync(e,{recursive:!0});let f=new b.default(d.default.join(e,"journal.db"));return f.pragma("busy_timeout = 5000"),f.pragma("journal_mode = WAL"),f.pragma("foreign_keys = ON"),f.exec(`
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
  `),f.prepare("PRAGMA table_info(entries)").all().some(a=>"details"===a.name)||f.exec("ALTER TABLE entries ADD COLUMN details TEXT"),a.g.__journalDb=f,f}(),h=g[f];return"function"==typeof h?h.bind(g):h}});function f(a){return{id:a.id,date:a.date,description:a.description,details:a.details,durationMinutes:a.duration_minutes,project:a.project,createdAt:a.created_at,updatedAt:a.updated_at}}function g(a){let b=e.prepare("SELECT * FROM entries WHERE id = ?").get(a);return b?f(b):void 0}a.s(["createEntry",0,function(a){return g(Number(e.prepare(`INSERT INTO entries (date, description, details, duration_minutes, project)
       VALUES (@date, @description, @details, @durationMinutes, @project)`).run(a).lastInsertRowid))},"deleteEntry",0,function(a){e.prepare("DELETE FROM entries WHERE id = ?").run(a)},"getEntriesByDate",0,function(a){return e.prepare("SELECT * FROM entries WHERE date = ? ORDER BY created_at ASC").all(a).map(f)},"getSummary",0,function(a,b){let c=e.prepare(`SELECT COALESCE(SUM(duration_minutes), 0) as totalMinutes, COUNT(*) as taskCount
       FROM entries WHERE date BETWEEN ? AND ?`).get(a,b),d=e.prepare(`SELECT COALESCE(NULLIF(project, ''), '(No project)') as project,
              SUM(duration_minutes) as minutes, COUNT(*) as count
       FROM entries WHERE date BETWEEN ? AND ?
       GROUP BY project ORDER BY minutes DESC`).all(a,b);return{totalMinutes:c.totalMinutes,taskCount:c.taskCount,byProject:d}},"listDistinctProjects",0,function(){return e.prepare(`SELECT DISTINCT project FROM entries
       WHERE project IS NOT NULL AND project != ''
       ORDER BY project COLLATE NOCASE`).all().map(a=>a.project)},"searchEntries",0,function(a){let b=a.replace(/[\\%_]/g,a=>`\\${a}`),c=`%${b}%`;return e.prepare(`SELECT * FROM entries
       WHERE description LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR details LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR project LIKE ? ESCAPE '\\' COLLATE NOCASE
       ORDER BY date DESC, created_at DESC`).all(c,c,c).map(f)},"updateEntry",0,function(a,b){return e.prepare(`UPDATE entries
     SET date = @date, description = @description, details = @details,
         duration_minutes = @durationMinutes, project = @project, updated_at = datetime('now')
     WHERE id = @id`).run({...b,id:a}),g(a)}],51476),a.s(["formatDuration",0,function(a){if(a<=0)return"0m";let b=Math.floor(a/60),c=a%60;return 0===b?`${c}m`:0===c?`${b}h`:`${b}h ${c}m`},"parseDuration",0,function(a){let b=a.trim().toLowerCase();if(!b)return null;if(/^\d+(\.\d+)?$/.test(b)){let a=parseFloat(b);return a>0?Math.round(a):null}let c=0,d=!1,e=b.match(/(\d+(?:\.\d+)?)\s*h(?:ours?|rs?|r)?\b/);e&&(c+=60*parseFloat(e[1]),d=!0);let f=b.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?\b/);if(f&&(c+=parseFloat(f[1]),d=!0),!d)return null;let g=Math.round(c);return g>0?g:null}],12798)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0ydub2q._.js.map