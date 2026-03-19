DROP TABLE IF EXISTS mood_logs CASCADE;
DROP TABLE IF EXISTS child_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS get_mood_logs_by_user(integer) CASCADE;
DROP TABLE IF EXISTS mood_drafts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nick VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    secret TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'parent',
    has_consented BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE child_profiles (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    pin TEXT NOT NULL, -- stored as salted hash
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mood_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES child_profiles(id) ON DELETE SET NULL,
    mood VARCHAR(50) NOT NULL,
    context VARCHAR(100),
    note TEXT,
    solution VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION register_parent_user(
    p_nick VARCHAR,
    p_email VARCHAR,
    p_secret TEXT,
    p_consented BOOLEAN
) 
RETURNS TABLE(id INTEGER, nick VARCHAR) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO users (nick, email, secret, role, has_consented)
    VALUES (p_nick, p_email, p_secret, 'parent', p_consented)
    RETURNING users.id, users.nick;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_by_nick(p_nick VARCHAR)
RETURNS SETOF users AS $$
BEGIN
    RETURN QUERY SELECT * FROM users WHERE nick = p_nick;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_by_email(p_email VARCHAR)
RETURNS SETOF users AS $$
BEGIN
    RETURN QUERY SELECT * FROM users WHERE email = p_email;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_mood_log(
    p_user_id INTEGER,
    p_mood VARCHAR,
    p_context VARCHAR,
    p_note TEXT,
    p_solution VARCHAR,
    p_child_id INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO mood_logs (user_id, child_id, mood, context, note, solution)
    VALUES (p_user_id, p_child_id, p_mood, p_context, p_note, p_solution);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_mood_logs_by_user(p_user_id INTEGER)
RETURNS SETOF mood_logs AS $$
BEGIN
    RETURN QUERY 
    SELECT * FROM mood_logs 
    WHERE user_id = p_user_id 
    ORDER BY timestamp DESC;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS mood_drafts (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    child_id TEXT NOT NULL DEFAULT '',
    draft JSONB,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS mood_drafts_user_child_idx ON mood_drafts (user_id, child_id);