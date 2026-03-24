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

// ---------------------------------------------------------------------------------------------------------------------

export async function getById(childId)
{
    const res = await pool.query('SELECT id, parent_id AS "parentId", name FROM child_profiles WHERE id = $1', [childId]);
    return res.rows[0] || null;
}

// ---------------------------------------------------------------------------------------------------------------------

export async function update(childId, { name, hasPin, pin })
{
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
    }

    if (hasPin !== undefined) {
        updates.push(`has_pin = $${paramCount++}`);
        values.push(hasPin);
    }

    if (pin !== undefined) {
        const pinHash = pin ? await hashSecret(pin) : null;
        updates.push(`pin = $${paramCount++}`);
        values.push(pinHash);
    }

    if (updates.length === 0) {
        return await getById(childId);
    }

    values.push(childId);
    const sql = `UPDATE child_profiles SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, parent_id AS "parentId", name`;
    const res = await pool.query(sql, values);
    return res.rows[0];
}

// ---------------------------------------------------------------------------------------------------------------------

export async function deleteChild(childId)
{
    await pool.query('DELETE FROM child_profiles WHERE id = $1', [childId]);
    return true;
}
