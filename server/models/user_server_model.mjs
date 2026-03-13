import pool from '../database/db.mjs';
import { hashSecret } from '../utils/auth_crypto.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export async function create(userData)
{
    console.log("Attempting to create user with data:", userData);

    const secretHash = await hashSecret(userData.secret);
    const sql = `SELECT * FROM register_parent_user($1, $2, $3, $4)`;
    const values = [userData.nick, userData.email || null, secretHash, !!userData.hasConsented];
    console.log(values);

    const res = await pool.query(sql, values);
    return res.rows[0];
}

// ---------------------------------------------------------------------------------------------------------------------

export async function findByEmail(email)
{
    console.log("Attempting to find user with data:", email);
    const sql = `SELECT * FROM get_user_by_email($1)`;
    const res = await pool.query(sql, [email]);
    console.log(res);
    return res.rows[0];
}

// ---------------------------------------------------------------------------------------------------------------------

export async function findById(id)
{
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0];
}

// ---------------------------------------------------------------------------------------------------------------------

export async function update(id, userData)
{
    const sql = `UPDATE users SET nick = COALESCE($2, nick), email = COALESCE($3, email) WHERE id = $1 RETURNING id, nick, email`;
    const values = [id, userData.nick || null, userData.email || null];
    const res = await pool.query(sql, values);
    return res.rows[0];
}

// ---------------------------------------------------------------------------------------------------------------------

export async function deleteById(id)
{
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return true;
}

// ---------------------------------------------------------------------------------------------------------------------

export async function listAll()
{
    const res = await pool.query('SELECT id, nick, email, role FROM users');
    return res.rows;
}

// ---------------------------------------------------------------------------------------------------------------------

const User =
{
    create,
    findByEmail,
    findById,
    update,
    delete: deleteById,
    listAll
};

export default User;
