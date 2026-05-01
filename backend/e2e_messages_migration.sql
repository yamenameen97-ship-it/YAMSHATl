-- Yamshat E2E chat migration
-- Stores only ciphertext plus wrapped AES key metadata.

ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted_key TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS iv TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encryption_version TEXT NOT NULL DEFAULT 'signal-v2';

ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_id INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signed_prekey_id INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signed_prekey TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signed_prekey_signature TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS prekeys TEXT;
