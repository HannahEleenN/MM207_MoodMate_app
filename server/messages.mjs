import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------------------------------------------------

const projectRoot = path.resolve(new URL('.', import.meta.url).pathname, '..');
const enPathCandidates = [
    path.join(projectRoot, 'client', 'translations', 'en.json'),
    path.join(projectRoot, '..', 'client', 'translations', 'en.json'),
];

// ---------------------------------------------------------------------------------------------------------------------

let en = {};
for (const p of enPathCandidates)
{
    try {
        if (fs.existsSync(p)) {
            en = JSON.parse(fs.readFileSync(p, 'utf8'));
            break;
        }
    } catch (err) {
    }
}

// ---------------------------------------------------------------------------------------------------------------------

if (!en || Object.keys(en).length === 0)
{
    en = {
        "register.requireConsent": "You must actively consent to the terms and privacy policy to create an account.",
        "register.nickTaken": "This nickname is already in use.",
        "auth.failed": "Wrong nickname or PIN code.",
        "user.notFound": "User not found."
    };
}

// ---------------------------------------------------------------------------------------------------------------------

export const Messages =
{
    CONSENT_ERROR: en['register.requireConsent'] || 'You must actively consent to the terms and privacy policy to create an account.',
    NICK_TAKEN_ERROR: en['register.nickTaken'] || 'This nickname is already in use.',
    DELETE_SUCCESS: 'User account and all associated data deleted permanently.',
    AUTH_FAILED: en['auth.failed'] || 'Wrong nickname or PIN code.',
    USER_NOT_FOUND: en['user.notFound'] || 'User not found.'
};