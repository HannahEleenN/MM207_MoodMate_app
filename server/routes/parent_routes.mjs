import express from 'express';
import userController from '../controllers/user_api_handler.mjs';
import { authorizeUserIdentity } from '../middleware/privacy_guard.mjs';

// ---------------------------------------------------------------------------------------------------------------------

const router = express.Router();

// ---------------------------------------------------------------------------------------------------------------------

router.post('/', userController.register);

router.post('/login', userController.login);

// ---------------------------------------------------------------------------------------------------------------------

router.get('/', authorizeUserIdentity, userController.listUsers);

router.put('/:id', authorizeUserIdentity, userController.updateUser);

router.delete('/:id', authorizeUserIdentity, userController.deleteAccount);

// ---------------------------------------------------------------------------------------------------------------------

export default router;
