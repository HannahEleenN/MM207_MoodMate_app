import pool from '../database/db.mjs';

// ---------------------------------------------------------------------------------------------------------------------

function validateIds(userId, childId)
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

    return { uid, cid };
}

// ---------------------------------------------------------------------------------------------------------------------

export const Draft =
{
    async upsert(userId, childId, draftObj)
    {
        const { uid, cid } = validateIds(userId, childId);

        if (!draftObj || typeof draftObj !== 'object')
        {
            const err = new Error('Draft must be a valid object');
            err.status = 400;
            throw err;
        }

        let res;
        try
        {
            const sql = `
            INSERT INTO mood_drafts (user_id, child_id, draft, saved_at) 
            VALUES ($1, $2, $3, now())
            ON CONFLICT (user_id, child_id) DO UPDATE 
            SET draft = EXCLUDED.draft, saved_at = now()
            RETURNING id, user_id, child_id, draft, saved_at
        `;

            res = await pool.query(sql, [uid, cid, JSON.stringify(draftObj)]);
        } catch (err) {
            console.error('[Draft.upsert] Database error:', err);
            err.status = err.status || 500;
            throw err;
        }

        if (!res.rows || !res.rows[0])
        {
            const dbErr = new Error('Failed to upsert draft');
            dbErr.status = 500;
            console.error('[Draft.upsert] Database error:', dbErr);
            throw dbErr;
        }

        /** @type {{id: number, user_id: number, child_id: number|null, draft: string, saved_at: string}} */
        const row = res.rows[0];
        const savedAt = row.saved_at ?? null;
        return {
            success: true,
            id: row.id,
            savedAt: savedAt
        };
    },

    async get(userId, childId)
    {
        const { uid, cid } = validateIds(userId, childId);

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

            /** @type {{draft: string, saved_at: string}} */
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

            const savedAt = row.saved_at ?? null;
            return {
                draft,
                savedAt: savedAt
            };
        } catch (err) {
            console.error('[Draft.get] Database error:', err);
            err.status = err.status || 500;
            throw err;
        }
    },

    async delete(userId, childId)
    {
        const { uid, cid } = validateIds(userId, childId);

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
