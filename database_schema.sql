CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar VARCHAR(500),
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    followers_count INTEGER NOT NULL DEFAULT 0,
    following_count INTEGER NOT NULL DEFAULT 0,
    fcm_token VARCHAR(1024),
    last_login_at TIMESTAMP NULL,
    banned_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    identity_key TEXT,
    registration_id INT,
    device_id INT DEFAULT 1,
    signed_prekey_id INT,
    signed_prekey TEXT,
    signed_prekey_signature TEXT,
    prekeys TEXT
);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    username TEXT,
    content TEXT,
    media TEXT,
    image_url TEXT,
    likes INT DEFAULT 0,
    created_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    username TEXT,
    comment TEXT,
    content TEXT,
    created_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS reels (
    id SERIAL PRIMARY KEY,
    username TEXT,
    video TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender TEXT,
    receiver TEXT,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    content TEXT,
    media_url TEXT,
    encrypted_key TEXT,
    iv TEXT,
    encryption_version TEXT,
    message_type VARCHAR(20) DEFAULT 'text',
    is_delivered BOOLEAN DEFAULT FALSE,
    is_seen BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_id INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signed_prekey_id INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signed_prekey TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signed_prekey_signature TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS prekeys TEXT;
