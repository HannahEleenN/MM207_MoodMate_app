import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(_scrypt);

// Create a salted scrypt hash for a secret (returns "salt:derivedKeyHex")

// Salted hashing means that even if two users have the same secret,
// their stored hashes will differ due to unique salts,
// enhancing security against rainbow table attacks.

export async function hashSecret(secret)
{
    const salt = randomBytes(16).toString('hex');
    const derivedKey = await scrypt(secret, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
}

// Verify a plain secret against stored "salt:hash". Returns boolean

export async function verifySecret(secret, stored)
{
    if (!stored || typeof stored !== 'string') return false;
    const parts = stored.split(':');
    if (parts.length !== 2) return false;
    const [salt, keyHex] = parts;
    try {
        const derivedKey = await scrypt(secret, salt, 64);
        const keyBuf = Buffer.from(keyHex, 'hex');
        // timingSafeEqual throws on length mismatch; wrap in try/catch
        return timingSafeEqual(keyBuf, derivedKey);
    } catch {
        return false;
    }
}