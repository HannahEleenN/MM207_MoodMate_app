import express from 'express';
import { privacyGuard } from '../middleware/privacyGuard.mjs';

const router = express.Router();

// Apply the privacy guard to all mood routes
// This ensures every request is checked for family/role permissions
router.use(privacyGuard);

router.get('/', (req, res) => {
    res.json({ message: "Showing logs for your family group." });
});

router.post('/', (req, res) => {
    res.status(201).json({ message: "Mood logged securely." });
});

export default router;
