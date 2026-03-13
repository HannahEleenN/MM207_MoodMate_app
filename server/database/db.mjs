import pkg from 'pg';

const { Pool } = pkg;
const connectionString = process.env.DATABASE_URL;
let pool = null;

// ---------------------------------------------------------------------------------------------------------------------

if (connectionString)
{
    pool = new Pool({ connectionString });

    try
    {
        await pool.query('SELECT 1');
        console.log('Successfully connected to the database.');
    } catch (err)
    {
        console.error('Database connection failed:', err);
        try { await pool.end(); } catch (e) { /* ignore */ }
        process.exit(1);
    }

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

    process.on('SIGINT', () => { closePool().finally(() => process.exit(0)); });
    process.on('SIGTERM', () => { closePool().finally(() => process.exit(0)); });
    process.on('exit', () => { if (pool) pool.end().catch(() => {}); });

} else {
    console.warn('No DATABASE_URL provided; database pool not created.');
}

// ---------------------------------------------------------------------------------------------------------------------

export default pool;