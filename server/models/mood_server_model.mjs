import pool from '../database/db.mjs';

let _moodLogColumns = null;

async function loadMoodLogColumns()
{
    if (_moodLogColumns) return _moodLogColumns;
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'mood_logs'");
    _moodLogColumns = new Set(res.rows.map(r => r['column_name']));
    return _moodLogColumns;
}

// ---------------------------------------------------------------------------------------------------------------------

export const Mood =
{
    create: async (data) =>
    {
        const userId = data.userId;
        const mood = data.mood || null;
        const context = data.context || null;
        const note = data.note || null;
        const solution = data.solution || null;
        const profileId = data.profileId || null;
        const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

        const cols = await loadMoodLogColumns();

        if (cols.has('solution') && cols.has('child_id'))
        {
            const sql = `INSERT INTO mood_logs (user_id, child_id, mood, context, note, solution, timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7)`;
            const values = [userId, profileId, mood, context, note, solution, timestamp];
            await pool.query(sql, values);
            return { success: true };
        }

        let mergedNote = note || '';
        if (solution) {
            mergedNote = mergedNote ? `${mergedNote}\nSOLUTION: ${solution}` : `SOLUTION: ${solution}`;
        }

        const fallbackSql = `INSERT INTO mood_logs (user_id, mood, context, note, timestamp) VALUES ($1,$2,$3,$4,$5)`;
        const fallbackValues = [userId, mood, context, mergedNote, timestamp];
        await pool.query(fallbackSql, fallbackValues);
        return { success: true };
    },

    findByUser: async (userId) =>
    {
        const sql = `
            SELECT 
                ml.*, 
                cp.name as child_name
            FROM mood_logs ml
            LEFT JOIN child_profiles cp ON ml.child_id = cp.id
            WHERE ml.user_id = $1 
            ORDER BY ml.timestamp DESC
        `;
        const res = await pool.query(sql, [userId]);
        return res.rows;
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export default Mood;
