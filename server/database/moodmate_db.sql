DROP TABLE IF EXISTS mood_logs CASCADE;
DROP TABLE IF EXISTS mood_drafts CASCADE;
DROP TABLE IF EXISTS child_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP FUNCTION IF EXISTS get_mood_logs_by_user(integer) CASCADE;
DROP FUNCTION IF EXISTS register_parent_user(varchar, varchar, text, boolean) CASCADE;
DROP FUNCTION IF EXISTS get_user_by_nick(varchar) CASCADE;
DROP FUNCTION IF EXISTS get_user_by_email(varchar) CASCADE;
DROP FUNCTION IF EXISTS create_mood_log(integer, varchar, varchar, text, varchar, integer) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

CREATE TYPE user_role AS ENUM ('parent', 'admin');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nick VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    secret TEXT NOT NULL,
    role user_role DEFAULT 'parent',
    has_consented BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nick ON users(nick);

CREATE TABLE child_profiles (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    pin TEXT,
    has_pin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_child_profiles_parent_id ON child_profiles(parent_id);
CREATE INDEX idx_child_profiles_has_pin ON child_profiles(has_pin);

CREATE TABLE mood_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES child_profiles(id) ON DELETE SET NULL,
    mood VARCHAR(50) NOT NULL,
    context VARCHAR(100),
    note TEXT,
    solution VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mood_logs_user_id ON mood_logs(user_id);
CREATE INDEX idx_mood_logs_child_id ON mood_logs(child_id);
CREATE INDEX idx_mood_logs_timestamp ON mood_logs(timestamp DESC);
CREATE INDEX idx_mood_logs_user_timestamp ON mood_logs(user_id, timestamp DESC);

CREATE TABLE mood_drafts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id INTEGER,
    draft JSONB NOT NULL,
    saved_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, child_id)
);

CREATE INDEX idx_mood_drafts_user_child ON mood_drafts(user_id, child_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER child_profiles_updated_at BEFORE UPDATE ON child_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION register_parent_user(
    p_nick VARCHAR,
    p_email VARCHAR,
    p_secret TEXT,
    p_consented BOOLEAN
)
RETURNS TABLE(id INTEGER, nick VARCHAR, email VARCHAR) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO users (nick, email, secret, role, has_consented)
    VALUES (p_nick, p_email, p_secret, 'parent'::user_role, p_consented)
    RETURNING users.id, users.nick, users.email;
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

CREATE OR REPLACE FUNCTION get_mood_logs_by_user(
    p_user_id INTEGER,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS SETOF mood_logs AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM mood_logs
    WHERE user_id = p_user_id
    ORDER BY timestamp DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
