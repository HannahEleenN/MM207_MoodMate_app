import { hashSecret, verifySecret } from '../utils/auth_crypto.mjs';
import pool from '../database/moodmate_db.sql';

const users = new Map();

function generateID()
{
    let id;
    do {
        id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
    } while (users.has(id));
    return id;
}

// ---------------------------------------------------------------------------------------------------------------------

export const User =
{
    async create(userData)
    {
        const sql = `SELECT * FROM register_parent_user($1, $2, $3)`;
        const values = [userData.nick, userData.secret, userData.hasConsented];

        const res = await pool.query(sql, values);
        return res.rows[0];
    },

    async findByNick(nick)
    {
        const sql = `SELECT * FROM get_user_by_nick($1)`;
        const res = await pool.query(sql, [nick]);
        return res.rows[0];
    }
};

 /*
export const User =
{
    // async because we hash secrets
    create: async (userData) =>
    {
        const id = generateID();
        const secretHash = await hashSecret(userData.secret);
        const newUser = {
            id,
            nick: userData.nick,
            secretHash,
            hasConsented: !!userData.hasConsented,
            consentedAt: new Date().toISOString(),
            profiles: []
        };
        users.set(id, newUser);
        return newUser;
    },

    addChildProfile: async (parentId, childName, pin) =>
    {
        const user = users.get(parentId);
        if (!user) return null;
        const pinHash = await hashSecret(pin);
        const newProfile = {
            profileId: generateID(),
            name: childName,
            pinHash,
            role: 'child'
        };
        user.profiles.push(newProfile);
        return newProfile;
    },

    findById: (id) => users.get(id),

    findByNick: (nick) => {
        return Array.from(users.values()).find(u => u.nick === nick);
    },

    findAll: () => Array.from(users.values()),

    // async search that verifies secret using verifySecret
    findBySecret: async (secret) =>
    {
        for (const u of users.values()) {
            if (await verifySecret(secret, u.secretHash)) return u;
        }
        return null;
    },

    delete: (id) => users.delete(id)

}; // End of User model

  */

// ---------------------------------------------------------------------------------------------------------------------

export default User;
