-- Yamshat E2E chat migration
-- Stores only ciphertext plus wrapped AES key metadata.

ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted_key TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS iv TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encryption_version TEXT NOT NULL DEFAULT 'hybrid-rsa-aes-v1';

CREATE TABLE IF NOT EXISTS chat_public_keys (
    username TEXT PRIMARY KEY,
    public_key TEXT NOT NULL,
    algorithm TEXT NOT NULL DEFAULT 'RSA_OAEP_SHA256',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
