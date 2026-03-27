import pool from '../database/db.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export const Draft =
{
    async upsert(userId, childId, draftObj)
    {
        const uid = Number(userId);
        if (!Number.isInteger(uid) || uid <= 0)
        {
            const err = new Error('Invalid userId: must be a positive integer');
            err.status = 400;
            throw err;
        }

        let cid = null;
        if (childId)
        {
            cid = Number(childId);
            if (!Number.isInteger(cid) || cid <= 0)
            {
                const err = new Error('Invalid childId: must be a positive integer or null');
                err.status = 400;
                throw err;
            }
        }

        if (!draftObj || typeof draftObj !== 'object')
        {
            const err = new Error('Draft must be a valid object');
            err.status = 400;
            throw err;
        }

        try
        {
            const sql = `
            INSERT INTO mood_drafts (user_id, child_id, draft, saved_at) 
            VALUES ($1, $2, $3, now())
            ON CONFLICT (user_id, child_id) DO UPDATE 
            SET draft = EXCLUDED.draft, saved_at = now()
            RETURNING id, user_id, child_id, draft, saved_at
        `;

            const res = await pool.query(sql, [uid, cid, JSON.stringify(draftObj)]);

            if (!res.rows[0]) {
                throw new Error('Failed to upsert draft');
            }

            return {
                success: true,
                id: res.rows[0].id,
                savedAt: res.rows[0].saved_at
            };
        } catch (err) {
            console.error('[Draft.upsert] Database error:', err);
            err.status = err.status || 500;
            throw err;
        }
    },

    async get(userId, childId)
    {
        const uid = Number(userId);
        if (!Number.isInteger(uid) || uid <= 0)
        {
            const err = new Error('Invalid userId');
            err.status = 400;
            throw err;
        }

        let cid = null;
        if (childId)
        {
            cid = Number(childId);
            if (!Number.isInteger(cid) || cid <= 0)
            {
                const err = new Error('Invalid childId');
                err.status = 400;
                throw err;
            }
        }

        try
        {
            const sql = `
                SELECT draft, saved_at 
                FROM mood_drafts 
                WHERE user_id = $1 AND child_id IS NOT DISTINCT FROM $2
                LIMIT 1
            `;

            const res = await pool.query(sql, [uid, cid]);

            if (!res.rows || res.rows.length === 0) {
                return null;
            }

            const row = res.rows[0];

            let draft = row.draft;
            if (typeof draft === 'string')
            {
                try {
                    draft = JSON.parse(draft);
                } catch (parseErr) {
                    console.warn('[Draft.get] Failed to parse draft JSON:', parseErr);
                    draft = {};
                }
            }

            return {
                draft,
                savedAt: row.saved_at
            };
        } catch (err) {
            console.error('[Draft.get] Database error:', err);
            err.status = err.status || 500;
            throw err;
        }
    },

    async delete(userId, childId)
    {
        const uid = Number(userId);
        if (!Number.isInteger(uid) || uid <= 0)
        {
            const err = new Error('Invalid userId');
            err.status = 400;
            throw err;
        }

        let cid = null;
        if (childId)
        {
            cid = Number(childId);
            if (!Number.isInteger(cid) || cid <= 0)
            {
                const err = new Error('Invalid childId');
                err.status = 400;
                throw err;
            }
        }

        try
        {
            const sql = `
                DELETE FROM mood_drafts 
                WHERE user_id = $1 AND child_id IS NOT DISTINCT FROM $2
                RETURNING id
            `;

            const res = await pool.query(sql, [uid, cid]);

            return {
                success: true,
                deletedCount: res.rowCount
            };
        } catch (err) {
            console.error('[Draft.delete] Database error:', err);
            err.status = err.status || 500;
            throw err;
        }
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export default Draft;
