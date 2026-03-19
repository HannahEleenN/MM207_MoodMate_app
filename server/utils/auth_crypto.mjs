import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';

// ---------------------------------------------------------------------------------------------------------------------

function scryptAsync(password, salt, keyLen)
{
    return new Promise((resolve, reject) =>
    {
        _scrypt(password, salt, keyLen, (err, derivedKey) =>
        {
            if (err) return reject(err);
            resolve(derivedKey);
        });
    });
}

// ---------------------------------------------------------------------------------------------------------------------

export async function hashSecret(secret)
{
    const salt = /** @type {Buffer} */ (randomBytes(16)).toString('hex');
    const derivedKey = /** @type {Buffer} */ (await scryptAsync(secret, salt, 64));
    return `${salt}:${derivedKey.toString('hex')}`;
}

// ---------------------------------------------------------------------------------------------------------------------

export async function verifySecret(secret, stored)
{
    if (!stored || typeof stored !== 'string') return false;
    const parts = stored.split(':');
    if (parts.length !== 2) return false;
    const [salt, keyHex] = parts;
    try
    {
        const derivedKey = /** @type {Buffer} */ (await scryptAsync(secret, salt, 64));
        const keyBuf = Buffer.from(keyHex, 'hex');
        if (keyBuf.length !== derivedKey.length) return false;
        return timingSafeEqual(keyBuf, derivedKey);
    } catch {
        return false;
    }
}