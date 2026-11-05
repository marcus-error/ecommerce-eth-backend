import express from 'express';
import {
  applyCoupon,
  adminGetCoupons,
  createCoupon,
  deleteCoupon,
  toggleCoupon
} from '../controllers/couponController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

export const createCouponRouter = (models) => {
  const router = express.Router();

  router.post('/apply', applyCoupon(models));
  router.get('/admin/all', authenticateToken, requireAdmin, adminGetCoupons(models));
  router.post('/admin', authenticateToken, requireAdmin, createCoupon(models));
  router.delete('/admin/:id', authenticateToken, requireAdmin, deleteCoupon(models));
  router.patch('/admin/:id/toggle', authenticateToken, requireAdmin, toggleCoupon(models));

  return router;
};

