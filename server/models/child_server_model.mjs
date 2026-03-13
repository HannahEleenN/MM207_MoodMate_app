import pool from '../database/db.mjs';
import { hashSecret, verifySecret } from '../utils/auth_crypto.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export async function create({ parentId, name, pin })
{
    const pinHash = await hashSecret(pin);
    const sql = `INSERT INTO child_profiles (parent_id, name, pin) VALUES ($1,$2,$3) RETURNING id, parent_id AS "parentId", name`;
    const res = await pool.query(sql, [parentId, name, pinHash]);
    return res.rows[0];
}

// ---------------------------------------------------------------------------------------------------------------------

export async function findByPin(pin)
{
    const res = await pool.query('SELECT * FROM child_profiles');
    for (const row of res.rows) {
        if (await verifySecret(pin, row.pin)) return row;
    }
    return null;
}

// ---------------------------------------------------------------------------------------------------------------------

export async function getByParent(parentId)
{
    const res = await pool.query('SELECT id, parent_id AS "parentId", name FROM child_profiles WHERE parent_id = $1', [parentId]);
    return res.rows;
}