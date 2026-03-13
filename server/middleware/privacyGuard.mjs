import jwt from 'jsonwebtoken';

export const authorizeUserIdentity = (req, res, next) =>
{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // Return a stable error key; client will translate using i18n.
        return res.status(401).json({ errorKey: "auth.no_token", message: "No access: you must log in again." });
    }

    try {
        const secret = process.env.JWT_SECRET || 'dev_secret';
        const decoded = jwt.verify(token, secret);

        req.user = { ...decoded, id: decoded.userId || decoded.id };

        const { id, role } = req.user;

        if (role === 'child') {
            if (req.params.userId && req.params.userId !== id) {
                return res.status(403).json({
                    errorKey: "auth.privacy_view_own_history",
                    message: "Privacy: you can only view your own history."
                });
            }
        }

        next();
    } catch (err) {
        // Token invalid / expired
        return res.status(403).json({ errorKey: "auth.session_expired", message: "Session expired. Please log in again." });
    }

};