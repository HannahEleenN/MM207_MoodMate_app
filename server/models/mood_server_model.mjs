import pool from '../database/db.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export const Mood =
{
    create: async (data) =>
    {
        const sql = `SELECT create_mood_log($1, $2, $3, $4)`;
        const values = [data.userId, data.mood, data.context, data.note];
        await pool.query(sql, values);
        return { success: true };
    },

    findByUser: async (userId) =>
    {
        const sql = `SELECT * FROM get_mood_logs_by_user($1)`;
        const res = await pool.query(sql, [userId]);
        return res.rows;
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export default Mood;
