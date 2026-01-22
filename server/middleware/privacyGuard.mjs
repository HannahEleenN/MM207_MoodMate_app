"use strict";

export const privacyGuard = (req, res, next) =>
{
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];
    const familyId = req.headers['x-family-id'];

    // Block anyone not in a family
    if (!familyId) {
        return res.status(401).json({ error: "Access Denied: No family context." });
    }

    // Sibling Privacy Logic
    if (userRole === 'child')
    {
        // If a child tries to access a specific log ID
        const targetChildId = req.params.childId;

        // If the URL specifies a child ID that isn't THEM, block it
        if (targetChildId && targetChildId !== userId)
        {
            return res.status(403).json({
                error: "Privacy Shield: You can only view your own mood history, not your siblings'."
            });
        }
    }

    // Parent Logic
    if (userRole === 'parent')
    {
        // Parents pass through to see any child in their familyId
        console.log(`Parent access granted for family: ${familyId}`);
    }

    next();
};