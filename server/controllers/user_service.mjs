import User from '../models/user_server_model.mjs';
import Mood from '../models/mood_server_model.mjs';
import { Messages } from '../messages.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// Domain/service layer. Throws errors with a `status` property
// so HTTP handlers can translate into responses.

export async function registerUserData({ nick, secret, hasConsented })
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

    if (User.findByNick(nick)) {
        const err = new Error(Messages.NICK_TAKEN_ERROR);
        err.status = 400;
        throw err;
    }

    const newUser = await User.create({ nick, secret, hasConsented });
    return { id: newUser.id, nick: newUser.nick };
}

// ---------------------------------------------------------------------------------------------------------------------

export async function authenticateSecret(secret)
{
    if (!secret) {
        const err = new Error('Missing secret');
        err.status = 400;
        throw err;
    }

    const user = await User.findBySecret(secret);
    if (!user) {
        const err = new Error(Messages.AUTH_FAILED);
        err.status = 404;
        throw err;
    }

    return { id: user.id, nick: user.nick };
}

// ---------------------------------------------------------------------------------------------------------------------

export async function deleteUserById(userId)
{
    const user = User.findById(userId);
    if (!user) {
        const err = new Error(Messages.USER_NOT_FOUND);
        err.status = 404;
        throw err;
    }

    // Remove all moods for this parent and then delete user
    Mood.deleteByParentId(userId);
    User.delete(userId);

    return { message: Messages.DELETE_SUCCESS };
}