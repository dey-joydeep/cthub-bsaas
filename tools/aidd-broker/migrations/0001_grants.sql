CREATE TABLE grants (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  role TEXT NOT NULL,
  executor TEXT NOT NULL,
  input_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('approved', 'running', 'succeeded', 'needs-reconciliation')),
  created_by TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  result_json TEXT
);

CREATE INDEX grants_executor_state ON grants (executor, state, expires_at);
CREATE INDEX grants_state_expiry ON grants (state, expires_at);
