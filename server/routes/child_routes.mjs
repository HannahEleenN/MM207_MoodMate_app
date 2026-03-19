import express from 'express';
import childController from '../controllers/child_api_handler.mjs';
import { authorizeUserIdentity } from '../middleware/privacy_guard.mjs';

const router = express.Router();

router.post('/parents/:parentId/children', authorizeUserIdentity, childController.createChild);

router.get('/parents/:parentId/children', authorizeUserIdentity, childController.listByParent);

router.post('/children/login', childController.loginByPin);

export default router;

