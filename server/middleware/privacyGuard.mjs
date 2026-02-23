import jwt from 'jsonwebtoken';

// Normalize decoded token so downstream code can always use req.user.id

export const privacyGuard = (req, res, next) =>
{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Ingen tilgang: Du må logge inn på nytt." });
    }

    try {
        const secret = process.env.JWT_SECRET || 'fallback_development_key';
        const decoded = jwt.verify(token, secret);

        // Normalize to a single `id` property so other modules can rely on req.user.id
        req.user = { ...decoded, id: decoded.userId || decoded.id };

        const { id, familyId, role } = req.user;

        if (role === 'child') {
            if (req.params.userId && req.params.userId !== id) {
                return res.status(403).json({
                    error: "Personvern: Du kan bare se din egen historikk."
                });
            }
        }

        next();
    } catch (err) {
        return res.status(403).json({ error: "Sesjonen er utløpt. Vennligst logg inn igjen." });
    }

}; // End of privacyGuard middleware