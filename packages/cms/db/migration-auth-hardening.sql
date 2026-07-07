-- Auth hardening migration (2026-06): token revocation, durable rate limiting, audit log
-- Additive only — safe to apply before deploying the new code.

ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_log (
  id TEXT PRIMARY KEY,
  event TEXT NOT NULL CHECK (event IN ('login_success', 'login_failure', 'password_change', 'logout')),
  email TEXT,
  user_id TEXT,
  ip TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
