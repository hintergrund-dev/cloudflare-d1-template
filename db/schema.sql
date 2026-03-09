-- Example schema for cloudflare-d1-template
-- Edit this file and run `npm run d1-sync -- --name <migration-name>` to apply changes.

CREATE TABLE IF NOT EXISTS notes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    title     TEXT    NOT NULL,
    body      TEXT    NOT NULL DEFAULT '',
    created_at TEXT   NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT   NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes (created_at);
