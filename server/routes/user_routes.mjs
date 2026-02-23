import express from 'express';
import userController from '../controllers/user_api_handler.mjs';

const router = express.Router();

// POST /api/users - register
router.post('/', userController.register);

// POST /api/users/login - login
router.post('/login', userController.login);

// DELETE /api/users/:id - delete account
router.delete('/:id', userController.deleteAccount);

export default router;
