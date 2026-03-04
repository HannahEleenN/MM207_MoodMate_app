import pool from '../database/db.mjs';
import { hashSecret, verifySecret } from '../utils/auth_crypto.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// User model interacting with the database

export const User =
    {
        // Creates a new parent by calling the SQL function
        // Note: register_parent_user expects (nick, email, secret, consent)
        create: async (userData) =>
        {
            console.log("Atempting to create user with data:", userData);

            const secretHash = await hashSecret(userData.secret);
            const sql = `SELECT * FROM register_parent_user($1, $2, $3, $4)`;
            const values = [userData.nick, userData.email || null, secretHash, !!userData.hasConsented];
            console.log(values);

            const res = await pool.query(sql, values);
            return res.rows[0]; // Returns { id, nick }
        },

        // Retrieves a user by nickname
        findByNick: async (nick) =>
        {
            const sql = `SELECT * FROM get_user_by_nick($1)`;
            const res = await pool.query(sql, [nick]);
            return res.rows[0];
        },

        // Retrieves a user by email
        findByEmail: async (email) =>
        {
            console.log("Atempting to find user with data:", email);
            const sql = `SELECT * FROM get_user_by_email($1)`;
            const res = await pool.query(sql, [email]);
            console.log(res);
            return res.rows[0];
        },

        // Retrieves a user by id
        findById: async (id) =>
        {
            const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            return res.rows[0];
        },

        // Update user (nick or email) — does not update secret
        update: async (id, userData) =>
        {
            const sql = `UPDATE users SET nick = COALESCE($2, nick), email = COALESCE($3, email) WHERE id = $1 RETURNING id, nick, email`;
            const values = [id, userData.nick || null, userData.email || null];
            const res = await pool.query(sql, values);
            return res.rows[0];
        },

        // Delete user by id
        delete: async (id) =>
        {
            await pool.query('DELETE FROM users WHERE id = $1', [id]);
            return true;
        },

        // Verifies secret/passcode (used during login)
        // Must fetch all users to check hashes because each user has a unique salt
        findBySecret: async (secret) =>
        {
            const res = await pool.query('SELECT * FROM users');
            for (const u of res.rows) {
                if (await verifySecret(secret, u.secret)) return u;
            }
            return null;
        },

        // List all users (admin/debug)
        listAll: async () =>
        {
            const res = await pool.query('SELECT id, nick, email, role FROM users');
            return res.rows;
        }
    };

// ---------------------------------------------------------------------------------------------------------------------

export default User;