import express from 'express';
import childController from '../controllers/child_api_handler.mjs';
import { authorizeUserIdentity } from '../middleware/privacy_guard.mjs';

const router = express.Router();

// Child authentication
router.post('/children/login', childController.loginByPin);

// Child management (parent-protected)
router.post('/children', authorizeUserIdentity, childController.createChild);
router.get('/children', authorizeUserIdentity, childController.listByParent);
router.put('/children/:childId', authorizeUserIdentity, childController.updateChild);

router.delete('/children/:childId', authorizeUserIdentity, childController.deleteChild);

export default router;
