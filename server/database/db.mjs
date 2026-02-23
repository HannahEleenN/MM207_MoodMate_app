import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false // Required for Render.com Postgres.
    }
});

export default pool;