-- Adds Google Authenticator (TOTP) fields to existing user accounts.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(128);
