-- V3: password reset columns on users (one live reset link per user)

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_hash varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at  timestamp(6) with time zone;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_used_at     timestamp(6) with time zone;

CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users (password_reset_token_hash);