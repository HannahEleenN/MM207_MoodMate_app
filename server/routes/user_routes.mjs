import express from 'express';
import userController from '../controllers/user_api_handler.mjs';
import { privacyGuard } from '../middleware/privacyGuard.mjs';

const router = express.Router();

// -- Public routes (no authentication required) -----------------------------------------------------------------------

// POST /api/users - register
router.post('/', userController.register);

// POST /api/users/login - login
router.post('/login', userController.login);

// -- Protected routes (require authentication) ------------------------------------------------------------------------

// GET /api/users - list all users (admin/debug)
router.get('/', privacyGuard, userController.listUsers);

// PUT /api/users/:id - update user info
router.put('/:id', privacyGuard, userController.updateUser);

// DELETE /api/users/:id - delete account
router.delete('/:id', privacyGuard, userController.deleteAccount);

export default router;