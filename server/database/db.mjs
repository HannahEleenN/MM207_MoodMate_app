import '../utils/load_env.mjs';
import pkg from 'pg';

const { Pool } = pkg;
const connectionString = process.env.DATABASE_URL;

// ---------------------------------------------------------------------------------------------------------------------

const poolConfig = connectionString ? { connectionString } :
{
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
    user: process.env.PGUSER || process.env.USER || 'postgres',
    password: process.env.PGPASSWORD || undefined,
    database: process.env.PGDATABASE || 'moodmate'
};

if (!connectionString && process.env.DATABASE_SSL === 'true') {
    poolConfig.ssl = { rejectUnauthorized: false };
}

// ---------------------------------------------------------------------------------------------------------------------

const pool = new Pool(poolConfig);

(async () =>
{
    try
    {
        await pool.query('SELECT 1');
        console.log('Successfully connected to the database.');
    } catch (err) {
        console.error('Database connection test failed:', err.message || err);
        console.warn('Proceeding without a confirmed DB connection. Queries will fail until the DB is available.');
    }
})();

// ---------------------------------------------------------------------------------------------------------------------

const closePool = async () =>
{
    if (!pool) return;
    try {
        await pool.end();
        console.log('Database pool closed.');
    } catch (e) {
        console.error('Error closing database pool:', e);
    }
};

// ---------------------------------------------------------------------------------------------------------------------

process.on('SIGINT', () => { closePool().finally(() => process.exit(0)); });
process.on('SIGTERM', () => { closePool().finally(() => process.exit(0)); });
process.on('exit', () => { if (pool) pool.end().catch(() => {}); });

// ---------------------------------------------------------------------------------------------------------------------

export default pool;