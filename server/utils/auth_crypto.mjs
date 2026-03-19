import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(_scrypt);

export async function hashSecret(secret)
{
    const salt = randomBytes(16).toString('hex');
    const derivedKey = await scrypt(secret, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifySecret(secret, stored)
{
    if (!stored || typeof stored !== 'string') return false;
    const parts = stored.split(':');
    if (parts.length !== 2) return false;
    const [salt, keyHex] = parts;
    try {
        const derivedKey = await scrypt(secret, salt, 64);
        const keyBuf = Buffer.from(keyHex, 'hex');
        return timingSafeEqual(keyBuf, derivedKey);
    } catch {
        return false;
    }
}