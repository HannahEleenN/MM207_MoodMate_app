import jwt from 'jsonwebtoken';

export const authorizeUserIdentity = (req, res, next) =>
{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Ingen tilgang: Du må logge inn på nytt.", errorKey: "auth.no_token" });
    }

    try {
        const secret = process.env.JWT_SECRET || 'dev_secret';
        const decoded = jwt.verify(token, secret);

        req.user = { ...decoded, id: decoded.userId || decoded.id };

        const { id, familyId, role } = req.user;

        if (role === 'child') {
            if (req.params.userId && req.params.userId !== id) {
                return res.status(403).json({
                    error: "Personvern: Du kan bare se din egen historikk.",
                    errorKey: "auth.privacy_view_own_history"
                });
            }
        }

        next();
    } catch (err) {
        return res.status(403).json({ error: "Sesjonen er utløpt. Vennligst logg inn igjen.", errorKey: "auth.session_expired" });
    }

};