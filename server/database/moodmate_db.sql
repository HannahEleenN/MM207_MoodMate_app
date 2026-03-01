-- 1. DROP EXISTING TABLES (To start with a clean slate)
DROP TABLE IF EXISTS mood_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nick VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    secret TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'parent',
    has_consented BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREATE MOOD LOGS TABLE
CREATE TABLE mood_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    mood VARCHAR(50) NOT NULL,
    context VARCHAR(100),
    note TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. FUNCTION: Register a parent user
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

-- 5. FUNCTION: Get user by nickname
CREATE OR REPLACE FUNCTION get_user_by_nick(p_nick VARCHAR)
RETURNS SETOF users AS $$
BEGIN
    RETURN QUERY SELECT * FROM users WHERE nick = p_nick;
END;
$$ LANGUAGE plpgsql;

-- 5b. FUNCTION: Get user by email
CREATE OR REPLACE FUNCTION get_user_by_email(p_email VARCHAR)
RETURNS SETOF users AS $$
BEGIN
    RETURN QUERY SELECT * FROM users WHERE email = p_email;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNCTION: Create a new mood log
CREATE OR REPLACE FUNCTION create_mood_log(
    p_user_id INTEGER,
    p_mood VARCHAR,
    p_context VARCHAR,
    p_note TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO mood_logs (user_id, mood, context, note)
    VALUES (p_user_id, p_mood, p_context, p_note);
END;
$$ LANGUAGE plpgsql;

-- 7. FUNCTION: Get mood logs for a specific user
CREATE OR REPLACE FUNCTION get_mood_logs_by_user(p_user_id INTEGER)
RETURNS SETOF mood_logs AS $$
BEGIN
    RETURN QUERY 
    SELECT * FROM mood_logs 
    WHERE user_id = p_user_id 
    ORDER BY timestamp DESC;
END;
$$ LANGUAGE plpgsql;