import pool from './database/db.mjs';

// ---------------------------------------------------------------------------------------------------------------------

async function show()
{
  try
  {
    const res = await pool.query("SELECT column_name, data_type, ordinal_position FROM information_schema.columns WHERE table_name = 'mood_logs' ORDER BY ordinal_position");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Schema query failed:', err);
  } finally {
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------------------------------------------------

show().catch(err =>
{
  console.error('Unhandled error in db_schema.show():', err);
  process.exit(1);
});
