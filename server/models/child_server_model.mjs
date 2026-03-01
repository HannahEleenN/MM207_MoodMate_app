import pool from '../database/db.mjs';
import { hashSecret, verifySecret } from '../utils/auth_crypto.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// Child model interacting with the database

export const Child =
    {
    // create a new child profile for a parent
    create: async ({ parentId, name, pin }) =>
    {
        const pinHash = await hashSecret(pin);
        const sql = `INSERT INTO child_profiles (parent_id, name, pin) VALUES ($1,$2,$3) RETURNING id, parent_id AS "parentId", name`;
        const res = await pool.query(sql, [parentId, name, pinHash]);
        return res.rows[0];
    },

    // find a child by verifying pins across all child profiles
    findByPin: async (pin) =>
    {
        const res = await pool.query('SELECT * FROM child_profiles');
        for (const row of res.rows) {
            if (await verifySecret(pin, row.pin)) return row; // returns full row with parent_id
        }
        return null;
    },

    // get children for a parent
    getByParent: async (parentId) =>
    {
        const res = await pool.query('SELECT id, parent_id AS "parentId", name FROM child_profiles WHERE parent_id = $1', [parentId]);
        return res.rows;
    }
};

export default Child;