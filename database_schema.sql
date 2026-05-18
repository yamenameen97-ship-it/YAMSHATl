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

-- Yamshat upgrade additions
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL DEFAULT 'ar',
  chat_translation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_blocks (
  id SERIAL PRIMARY KEY,
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_blocks_pair UNIQUE (blocker_id, blocked_id)
);

-- Advanced Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks (blocked_id);
