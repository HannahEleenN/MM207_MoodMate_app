import pool from '../database/db.mjs';

export const Draft =
{
    async upsert(userId, childId, draftObj)
    {
        const cid = childId || '';
        const sql = `INSERT INTO mood_drafts (user_id, child_id, draft, saved_at) VALUES ($1,$2,$3,now())
            ON CONFLICT (user_id, child_id) DO UPDATE SET draft = EXCLUDED.draft, saved_at = now()`;
        const vals = [String(userId), String(cid), JSON.stringify(draftObj)];
        await pool.query(sql, vals);
        return { success: true };
    },

    async get(userId, childId)
    {
        const cid = childId || '';
        const sql = `SELECT draft, saved_at FROM mood_drafts WHERE user_id = $1 AND child_id = $2 LIMIT 1`;
        const res = await pool.query(sql, [String(userId), String(cid)]);
        if (res && res.rows && res.rows.length) return res.rows[0];
        return null;
    },

    async delete(userId, childId)
    {
        const cid = childId || '';
        const sql = `DELETE FROM mood_drafts WHERE user_id = $1 AND child_id = $2`;
        await pool.query(sql, [String(userId), String(cid)]);
        return { success: true };
    }
};

export default Draft;
