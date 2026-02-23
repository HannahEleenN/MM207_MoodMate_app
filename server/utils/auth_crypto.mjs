import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';

// Create a salted scrypt hash for a secret (returns salt:derivedKey)

export const hashSecret = (secret) =>
{
    return new Promise((resolve, reject) =>
    {
        const salt = randomBytes(16).toString('hex');
        scrypt(secret, salt, 64, (err, derivedKey) =>
        {
            if (err) return reject(err);
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
};

// Verify a plain secret against a stored salt:hash. Returns boolean

export const verifySecret = (secret, storedHash) =>
{
    return new Promise((resolve, reject) =>
    {
        const [salt, key] = storedHash.split(':');
        if (!salt || !key) return resolve(false);
        scrypt(secret, salt, 64, (err, derivedKey) =>
        {
            if (err) return reject(err);
            try {
                const match = timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
                resolve(match);
            } catch (e) {
                // timingSafeEqual throws on length mismatch
                resolve(false);
            }
        });
    });
};
