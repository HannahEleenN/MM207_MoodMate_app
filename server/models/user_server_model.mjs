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
        const sql = `SELECT * FROM register_parent_user($1, $2, $3)`;
        const values = [userData.nick, secretHash, !!userData.hasConsented];

        const res = await pool.query(sql, values);
        return res.rows[0]; // Returns { id, nick }
    },

    // Retrieves a user by nickname
    findByNick: async (nick) =>
    {
        const sql = `SELECT * FROM get_user_by_nick($1)`;
        const res = await pool.query(sql, [nick]);
        return res.rows[0]; // Returns the full user object (including secret) or undefined
    },

    // Verifies secret/passcode (used during login)
    findBySecret: async (secret) =>
    {
        // We must fetch all users to check hashes (because each user has a unique salt)
        const res = await pool.query('SELECT * FROM users');
        for (const u of res.rows) {
            if (await verifySecret(secret, u.secret)) return u;
        }
        return null;
    }
};

// ---------------------------------------------------------------------------------------------------------------------

export default User;
