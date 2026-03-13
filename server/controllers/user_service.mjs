import User from '../models/user_server_model.mjs';
import { Messages } from '../messages.mjs';
import { verifySecret } from '../utils/auth_crypto.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export async function registerUserData({ nick, email, secret, hasConsented })
{
    console.log("Registering new user...");

    if (hasConsented !== true)
    {
        const err = new Error(Messages.CONSENT_ERROR);
        err.status = 400;
        throw err;
    }

    if (!email || !secret)
    {
        const err = new Error('Email and password are required');
        err.status = 400;
        throw err;
    }

    let safeNick = nick && String(nick).trim();
    if (!safeNick)
    {
        const localPart = String(email).split('@')[0] || 'parent';
        safeNick = localPart.substring(0, 50);
    }

    const existingByEmail = await User.findByEmail(email);
    if (existingByEmail)
    {
        const err = new Error('Email already registered');
        err.status = 400;
        throw err;
    }

    console.log("Attempting to save user to database...");
    const newUser = await User.create({ nick: safeNick, email, secret, hasConsented });

    console.log("User registered successfully with ID:", newUser.id);
    return { id: newUser.id, email: newUser.email };
}

// ---------------------------------------------------------------------------------------------------------------------

export async function authenticateSecret(email, secret)
{
    if (!email || !secret)
    {
        const err = new Error('Both email and password must be provided');
        err.status = 400;
        throw err;
    }

    const user = await User.findByEmail(email);
    if (!user)
    {
        const err = new Error(Messages.AUTH_FAILED);
        err.status = 401;
        throw err;
    }

    const isValid = await verifySecret(secret, user.secret);
    if (!isValid)
    {
        const err = new Error(Messages.AUTH_FAILED);
        err.status = 401;
        throw err;
    }

    return {
        id: user.id,
        email: user.email,
        role: user.role,
        familyId: user.id
    };
}

// ---------------------------------------------------------------------------------------------------------------------

export async function deleteUserById(userId)
{
    const user = await User.findById(userId);
    if (!user)
    {
        const err = new Error(Messages.USER_NOT_FOUND);
        err.status = 404;
        throw err;
    }

    return await User.delete(userId);
}

// ---------------------------------------------------------------------------------------------------------------------

export async function listAllUsers()
{
    return await User.listAll();
}

// ---------------------------------------------------------------------------------------------------------------------

export async function updateUserById(id, userData)
{
    const user = await User.findById(id);
    if (!user)
    {
        const err = new Error(Messages.USER_NOT_FOUND);
        err.status = 404;
        throw err;
    }

    return await User.update(id, userData);
}