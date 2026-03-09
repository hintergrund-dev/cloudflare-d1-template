CREATE TABLE IF NOT EXISTS notes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    title     TEXT    NOT NULL,
    body      TEXT    NOT NULL DEFAULT '',
    created_at TEXT   NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT   NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notes_created_at ON notes (created_at);
