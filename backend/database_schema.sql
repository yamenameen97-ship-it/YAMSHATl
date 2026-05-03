
CREATE TABLE users(id SERIAL PRIMARY KEY, name TEXT, email TEXT, password TEXT);
CREATE TABLE posts(id SERIAL PRIMARY KEY, username TEXT, content TEXT, media TEXT, likes INT DEFAULT 0);
CREATE TABLE comments(id SERIAL PRIMARY KEY, post_id INT, username TEXT, comment TEXT);
CREATE TABLE reels(id SERIAL PRIMARY KEY, username TEXT, video TEXT);
CREATE TABLE messages(id SERIAL PRIMARY KEY, sender TEXT, receiver TEXT, message TEXT, encrypted_key TEXT, iv TEXT, encryption_version TEXT DEFAULT 'signal-v2');
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_id INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signed_prekey_id INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signed_prekey TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signed_prekey_signature TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS prekeys TEXT;
