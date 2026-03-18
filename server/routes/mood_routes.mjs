import express from 'express';
import { createMood, getAllMoods, getMoodById, updateMood, deleteMood } from '../controllers/mood_api_handler.mjs';
import { authorizeUserIdentity } from '../middleware/privacyGuard.mjs';

// ---------------------------------------------------------------------------------------------------------------------

const router = express.Router();

router.use(authorizeUserIdentity);

router.post('/', createMood);
router.get('/', getAllMoods);
router.get('/:id', getMoodById);
router.patch('/:id', updateMood);
router.delete('/:id', deleteMood);

// ---------------------------------------------------------------------------------------------------------------------

router.put('/draft', async (req, res) => {
    const { saveDraft } = await import('../controllers/mood_api_handler.mjs');
    return saveDraft(req, res);
});

router.get('/draft', async (req, res) => {
    const { getDraft } = await import('../controllers/mood_api_handler.mjs');
    return getDraft(req, res);
});

router.delete('/draft', async (req, res) => {
    const { deleteDraft } = await import('../controllers/mood_api_handler.mjs');
    return deleteDraft(req, res);
});

// ---------------------------------------------------------------------------------------------------------------------

export default router;