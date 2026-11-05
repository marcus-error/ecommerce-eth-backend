import express from 'express';
import {
  getBanners,
  adminGetBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner
} from '../controllers/bannerController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

export const createBannerRouter = (models) => {
  const router = express.Router();

  router.get('/', getBanners(models));
  router.get('/admin/all', authenticateToken, requireAdmin, adminGetBanners(models));
  router.post('/admin', authenticateToken, requireAdmin, createBanner(models));
  router.put('/admin/:id', authenticateToken, requireAdmin, updateBanner(models));
  router.delete('/admin/:id', authenticateToken, requireAdmin, deleteBanner(models));
  router.patch('/admin/:id/toggle', authenticateToken, requireAdmin, toggleBanner(models));

  return router;
};

