import pool from '../database/db.mjs';

// Cache of available columns for mood_logs (to support different DB schemas)
let _moodLogColumns = null;

async function loadMoodLogColumns()
{
    if (_moodLogColumns) return _moodLogColumns;
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'mood_logs'");
    _moodLogColumns = new Set(res.rows.map(r => r.column_name));
    return _moodLogColumns;
}

// ---------------------------------------------------------------------------------------------------------------------

export const Mood =
{
    create: async (data) =>
    {
        // Normalize inputs
        const userId = data.userId;
        const mood = data.mood || null;
        const context = data.context || null;
        const note = data.note || null;
        const solution = data.solution || null;
        const profileId = data.profileId || null;
        const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

        // Determine which columns exist in the DB and build INSERT accordingly
        const cols = await loadMoodLogColumns();

        if (cols.has('solution') && cols.has('child_id')) {
            const sql = `INSERT INTO mood_logs (user_id, child_id, mood, context, note, solution, timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7)`;
            const values = [userId, profileId, mood, context, note, solution, timestamp];
            await pool.query(sql, values);
            return { success: true };
        }

        // If the DB doesn't have solution/child_id, fall back to inserting into existing columns
        // We'll append the solution to the note so the information isn't lost.
        let mergedNote = note || '';
        if (solution) {
            mergedNote = mergedNote ? `${mergedNote}\nLØSNING: ${solution}` : `LØSNING: ${solution}`;
        }

        const fallbackSql = `INSERT INTO mood_logs (user_id, mood, context, note, timestamp) VALUES ($1,$2,$3,$4,$5)`;
        const fallbackValues = [userId, mood, context, mergedNote, timestamp];
        await pool.query(fallbackSql, fallbackValues);
        return { success: true };
    },

    findByUser: async (userId) =>
    {
        const sql = `SELECT * FROM mood_logs WHERE user_id = $1 ORDER BY timestamp DESC`;
        const res = await pool.query(sql, [userId]);
        return res.rows;
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export default Mood;
