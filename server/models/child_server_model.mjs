import pool from '../database/db.mjs';
import { hashSecret, verifySecret } from '../utils/auth_crypto.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export async function create({ parentId, name, age, pin })
{
    if (!parentId || !name) {
        throw new Error('parentId and name are required');
    }

    const pinHash = pin ? await hashSecret(pin) : null;
    const hasPin = !!pin;

    const sql = `
        INSERT INTO child_profiles (parent_id, name, age, pin, has_pin) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING id, parent_id AS "parentId", name, age, has_pin AS "hasPin"
    `;
    const res = await pool.query(sql, [parentId, name, age || null, pinHash, hasPin]);

    if (!res.rows[0]) {
        throw new Error('Failed to create child profile');
    }

    return res.rows[0];
}

// ---------------------------------------------------------------------------------------------------------------------

export async function findByPinWithParent(parentId, pin)
{
    if (!parentId || !pin) {
        throw new Error('parentId and pin are required');
    }

    const res = await pool.query(
        'SELECT * FROM child_profiles WHERE parent_id = $1 AND has_pin = true',
        [parentId]
    );

    for (const row of res.rows)
    {
        if (await verifySecret(pin, row.pin))
        {
            return
            {
                id: row.id,
                    parentId: row.parent_id,
                name: row.name,
                age: row.age,
                hasPin: row.has_pin
            };
        }
    }
    return null;
}

// ---------------------------------------------------------------------------------------------------------------------

export async function getByParent(parentId)
{
    if (!parentId) throw new Error('parentId is required');

    const res = await pool.query(
        'SELECT id, parent_id AS "parentId", name, age, has_pin AS "hasPin" FROM child_profiles WHERE parent_id = $1 ORDER BY created_at DESC',
        [parentId]
    );
    return res.rows;
}

// ---------------------------------------------------------------------------------------------------------------------

export async function getById(childId)
{
    if (!childId) throw new Error('childId is required');

    const res = await pool.query(
        'SELECT id, parent_id AS "parentId", name, age, has_pin AS "hasPin" FROM child_profiles WHERE id = $1',
        [childId]
    );
    return res.rows[0] || null;
}

// ---------------------------------------------------------------------------------------------------------------------

export async function update(childId, { name, age, hasPin, pin })
{
    if (!childId) throw new Error('childId is required');

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined && name !== null)
    {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
    }

    if (age !== undefined)
    {
        updates.push(`age = $${paramCount++}`);
        values.push(age || null);
    }

    if (hasPin !== undefined)
    {
        updates.push(`has_pin = $${paramCount++}`);
        values.push(hasPin);
    }

    if (pin !== undefined)
    {
        const pinHash = pin && pin.trim() ? await hashSecret(pin) : null;
        updates.push(`pin = $${paramCount++}`);
        values.push(pinHash);

        updates.push(`has_pin = $${paramCount++}`);
        values.push(!!pinHash);
    }

    if (updates.length === 0) {
        return await getById(childId);
    }

    values.push(childId);
    const sql = `
        UPDATE child_profiles
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
            RETURNING id, parent_id AS "parentId", name, age, has_pin AS "hasPin"
    `;

    const res = await pool.query(sql, values);
    if (!res.rows[0]) {
        throw new Error('Child profile not found');
    }

    return res.rows[0];
}

// ---------------------------------------------------------------------------------------------------------------------

export async function deleteChild(childId)
{
    if (!childId) throw new Error('childId is required');

    const res = await pool.query(
        'DELETE FROM child_profiles WHERE id = $1 RETURNING id',
        [childId]
    );

    if (!res.rows[0]) {
        throw new Error('Child profile not found');
    }

    return true;
}

// ---------------------------------------------------------------------------------------------------------------------

export default
{
    create,
    findByPinWithParent,
    getByParent,
    getById,
    update,
    deleteChild
};
