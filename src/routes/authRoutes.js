import express from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

export const createAuthRouter = (models) => {
  const router = express.Router();

  router.post('/register', register(models));
  router.post('/login', login(models));
  router.get('/me', authenticateToken, getMe(models));
  router.put('/profile', authenticateToken, updateProfile(models));

  return router;
};

