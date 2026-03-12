import express from 'express';
import { createMood, getAllMoods, getMoodById, updateMood, deleteMood } from '../controllers/mood_api_handler.mjs';
import { authorizeUserIdentity } from '../middleware/privacyGuard.mjs';

const router = express.Router();

// All mood routes are protected by privacyGuard
router.use(authorizeUserIdentity);

router.post('/', createMood);
router.get('/', getAllMoods);
router.get('/:id', getMoodById);
router.patch('/:id', updateMood);
router.delete('/:id', deleteMood);

export default router;
