import express from 'express';
import childController from '../controllers/child_api_handler.mjs';
import { authorizeUserIdentity } from '../middleware/privacy_guard.mjs';

const router = express.Router();

router.post('/children', authorizeUserIdentity, childController.createChild);

router.get('/children', authorizeUserIdentity, childController.listByParent);

router.put('/children/:childId', authorizeUserIdentity, childController.updateChild);

router.delete('/children/:childId', authorizeUserIdentity, childController.deleteChild);

router.post('/children/login', childController.loginByPin);

router.post('/parents/:parentId/children', authorizeUserIdentity, childController.createChild);

router.get('/parents/:parentId/children', authorizeUserIdentity, childController.listByParent);

router.put('/parents/:parentId/children/:childId', authorizeUserIdentity, childController.updateChild);

router.delete('/parents/:parentId/children/:childId', authorizeUserIdentity, childController.deleteChild);

export default router;
