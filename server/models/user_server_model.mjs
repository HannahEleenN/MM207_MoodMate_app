import pool from '../database/db.mjs';
import { hashSecret, verifySecret } from '../utils/auth_crypto.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// User model interacting with the database

export const User =
{
    // Creates a new parent by calling the SQL function
    create: async (userData) =>
    {
        const secretHash = await hashSecret(userData.secret);
        const sql = `SELECT * FROM register_parent_user($1, $2, $3, $4)`;
        const values = [userData.nick, userData.email || null, secretHash, !!userData.hasConsented];
        const res = await pool.query(sql, values);
        return res.rows[0]; // Returns { id, nick }
    },

    // Find user by nickname
    findByNick: async (nick) =>
    {
        const sql = `SELECT * FROM get_user_by_nick($1)`;
        const res = await pool.query(sql, [nick]);
        return res.rows[0];
    },

    // Find by email
    findByEmail: async (email) =>
    {
        const sql = `SELECT * FROM get_user_by_email($1)`;
        const res = await pool.query(sql, [email]);
        return res.rows[0];
    },

    // Find by id
    findById: async (id) =>
    {
        const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return res.rows[0];
    },

    // Delete by id
    delete: async (id) =>
    {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        return true;
    },

    // Verifies secret/passcode (used during login). Keeps scanning stored users to verify hashes.
    findBySecret: async (secret) =>
    {
        const res = await pool.query('SELECT * FROM users');
        for (const u of res.rows) {
            if (await verifySecret(secret, u.secret)) return u;
        }
        return null;
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export default User;
