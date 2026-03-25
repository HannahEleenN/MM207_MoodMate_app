import express from 'express';
import { createMood, getAllMoods, getMoodById, updateMood, deleteMood, saveDraft, getDraft, deleteDraft } from '../controllers/mood_api_handler.mjs';
import { authorizeUserIdentity } from '../middleware/privacy_guard.mjs';

// ---------------------------------------------------------------------------------------------------------------------

const router = express.Router();

router.use(authorizeUserIdentity);

// Mood CRUD operations
router.post('/', createMood);
router.get('/', getAllMoods);
router.get('/:id', getMoodById);
router.patch('/:id', updateMood);
router.delete('/:id', deleteMood);

// Draft operations (improved REST design - drafts as child resources)
router.post('/drafts/:profileId', saveDraft);
router.get('/drafts/:profileId', getDraft);
router.delete('/drafts/:profileId', deleteDraft);

export default router;
