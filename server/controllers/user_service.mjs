import User from '../models/user_server_model.mjs';
import { Messages } from '../messages.mjs';
import { verifySecret } from '../utils/auth_crypto.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export async function registerUserData({ nick, email, secret, hasConsented })
{
    if (hasConsented !== true) {
        const err = new Error(Messages.CONSENT_ERROR);
        err.status = 400;
        throw err;
    }

    if (!nick || !secret) {
        const err = new Error('Missing fields');
        err.status = 400;
        throw err;
    }

    const existingUser = await User.findByNick(nick);
    if (existingUser) {
        const err = new Error(Messages.NICK_TAKEN_ERROR);
        err.status = 400;
        throw err;
    }

    const newUser = await User.create({ nick, email, secret, hasConsented });
    return { id: newUser.id, nick: newUser.nick };
}

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Authenticates user based on email and password (secret).
 */
export async function authenticateSecret(email, secret)
{
    // 1. Validate that necessary input is provided
    if (!email || !secret) {
        const err = new Error('Both email and password must be provided');
        err.status = 400;
        throw err;
    }

    // 2. Find the user in the database via email
    const user = await User.findByEmail(email);

    if (!user) {
        const err = new Error(Messages.AUTH_FAILED);
        err.status = 401; // Use 401 for invalid credentials
        throw err;
    }

    // 3. Verify the password (hash comparison)
    // user.secret contains the hashed value from the database
    const isValid = await verifySecret(secret, user.secret);

    if (!isValid) {
        const err = new Error(Messages.AUTH_FAILED);
        err.status = 401;
        throw err;
    }

    // 4. Return only necessary user info (exclude password hash)
    return {
        id: user.id,
        nick: user.nick,
        role: user.role,
        familyId: user.id // In current logic, parentId is often the same as familyId
    };
}

// ---------------------------------------------------------------------------------------------------------------------

export async function deleteUserById(userId)
{
    const user = await User.findById(userId);
    if (!user) {
        const err = new Error(Messages.USER_NOT_FOUND);
        err.status = 404;
        throw err;
    }
    return await User.delete(userId);
}