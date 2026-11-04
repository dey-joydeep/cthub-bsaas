CREATE TABLE task_mandates (
  id TEXT PRIMARY KEY,
  outcome TEXT NOT NULL,
  issue_number INTEGER,
  branch TEXT NOT NULL,
  allowed_paths_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('active', 'revoked')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE mandate_action_usage (
  mandate_id TEXT NOT NULL REFERENCES task_mandates(id),
  action TEXT NOT NULL,
  max_issued INTEGER NOT NULL CHECK (max_issued BETWEEN 1 AND 100),
  issued INTEGER NOT NULL DEFAULT 0 CHECK (issued >= 0),
  PRIMARY KEY (mandate_id, action)
);

CREATE TABLE owner_approval_steps (
  step INTEGER PRIMARY KEY,
  mandate_id TEXT NOT NULL REFERENCES task_mandates(id)
);

CREATE TABLE owner_approval_attempts (
  principal TEXT NOT NULL,
  window INTEGER NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts BETWEEN 1 AND 5),
  PRIMARY KEY (principal, window)
);

ALTER TABLE grants ADD COLUMN mandate_id TEXT REFERENCES task_mandates(id);
ALTER TABLE grants ADD COLUMN request_id TEXT;
ALTER TABLE grants ADD COLUMN request_hash TEXT;
CREATE UNIQUE INDEX grants_mandate_request ON grants (mandate_id, request_id);
CREATE INDEX grants_mandate_state ON grants (mandate_id, state);
CREATE INDEX mandates_state_expiry ON task_mandates (state, expires_at);
