import express from 'express';
import userController from '../controllers/user_api_handler.mjs';
import { authorizeUserIdentity } from '../middleware/privacyGuard.mjs';

const router = express.Router();

// -- Public routes (no authentication required) -----------------------------------------------------------------------

// POST /api/users - register
router.post('/', userController.register);

// POST /api/users/login - login
router.post('/login', userController.login);

// -- Protected routes (require authentication) ------------------------------------------------------------------------

// GET /api/users - list all users (admin/debug)
router.get('/', authorizeUserIdentity, userController.listUsers);

// PUT /api/users/:id - update user info
router.put('/:id', authorizeUserIdentity, userController.updateUser);

// DELETE /api/users/:id - delete account
router.delete('/:id', authorizeUserIdentity, userController.deleteAccount);

export default router;