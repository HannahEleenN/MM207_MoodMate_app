CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'child'))
);

CREATE TABLE mood_logs (
    id SERIAL PRIMARY KEY,
    child_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    emotion VARCHAR(50) NOT NULL, 
    reason TEXT, 
    solution TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);