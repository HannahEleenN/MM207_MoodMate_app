import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;
console.log(connectionString);

// Only create the pool when a connection string is available. This avoids
// opening a DB connection during environments where the DB is not configured
// (and makes it easy to cleanly shutdown the pool on process termination).
let pool = null;

if (connectionString) {
    pool = new Pool({ connectionString });

    try {
        // Lightweight probe to verify connectivity (avoids selecting all rows)
        await pool.query('SELECT 1');
        console.log(`Successfully connected to the database at ${connectionString}`);
    } catch (err) {
        console.error('Database connection failed:', err);
        // Try to end the pool if created, then exit with failure
        try { await pool.end(); } catch (e) { /* ignore */ }
        process.exit(1);
    }

    // Graceful shutdown: close the pool when the Node process is stopping.
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

    process.on('SIGINT', () => {
        closePool().finally(() => process.exit(0));
    });

    process.on('SIGTERM', () => {
        closePool().finally(() => process.exit(0));
    });

    // Ensure we attempt to close on normal exit as well (best-effort)
    process.on('exit', () => {
        if (pool) pool.end().catch(() => {});
    });
} else {
    console.warn('No DATABASE_URL provided; database pool not created.');
}

export default pool;