
CREATE TABLE users(id SERIAL PRIMARY KEY, name TEXT, email TEXT, password TEXT);
CREATE TABLE posts(id SERIAL PRIMARY KEY, username TEXT, content TEXT, media TEXT, likes INT DEFAULT 0);
CREATE TABLE comments(id SERIAL PRIMARY KEY, post_id INT, username TEXT, comment TEXT);
CREATE TABLE reels(id SERIAL PRIMARY KEY, username TEXT, video TEXT);
CREATE TABLE messages(id SERIAL PRIMARY KEY, sender TEXT, receiver TEXT, message TEXT);
