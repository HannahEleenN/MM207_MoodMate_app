import User from '../models/user_server_model.mjs';
import * as Child from '../models/child_server_model.mjs';
import { Messages } from '../messages.mjs';
import { verifySecret } from '../utils/auth_crypto.mjs';

// ---------------------------------------------------------------------------------------------------------------------

export async function registerUserData(payload)
{
    const { nick, email, secret } = payload || {};
    const hasConsented = !!(payload && (payload.hasConsented ?? payload.has_consented));

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

    const createResult = await User.create({ nick: safeNick, email, secret, hasConsented });

    const saved = await User.findById(createResult.id);
    console.log("User registered successfully with ID:", saved && saved.id);

    return {
        id: saved.id,
        email: saved.email,
        nick: saved.nick,
        role: saved.role
    };
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
    
    let profiles = [];
    try {
        profiles = await Child.getByParent(user.id);
    } catch (err) {
        console.warn('Failed to load child profiles:', err.message);
    }

    return {
        id: user.id,
        email: user.email,
        role: user.role,
        familyId: user.id,
        profiles: profiles || []
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