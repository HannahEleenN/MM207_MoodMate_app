import jwt from 'jsonwebtoken';

export const privacyGuard = (req, res, next) =>
{
    // Retrieve token from Authorization header (Bearer <token>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access Denied: No token provided." });
    }

    try {
        // First look for the secret in the .env file. If missing, it uses the fallback string.
        const secret = process.env.JWT_SECRET || 'fallback_development_key';
        const decoded = jwt.verify(token, secret);

        // Attach user data to the request object so the controller can access it
        req.user = decoded;

        const { userId, familyId, role } = decoded;

        // Sibling Privacy Logic
        if (role === 'child')
        {
            // Check if they are trying to access another user's ID via URL parameters
            if (req.params.userId && req.params.userId !== userId) {
                return res.status(403).json({
                    error: "Privacy Shield: You can only view your own history."
                });
            }
        }

        // Cross-Family Leak Prevention

        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};