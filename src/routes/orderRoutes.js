import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  adminGetOrders,
  adminUpdateOrderStatus
} from '../controllers/orderController.js';
import { authenticateToken, optionalAuth, requireAdmin } from '../middleware/authMiddleware.js';

export const createOrderRouter = (models) => {
  const router = express.Router();

  // Public / Customer order creation (allows guest with optional auth)
  router.post('/', optionalAuth, createOrder(models));
  router.get('/my-orders', authenticateToken, getMyOrders(models));
  router.get('/:id', optionalAuth, getOrderById(models));

  // Admin order management
  router.get('/admin/all', authenticateToken, requireAdmin, adminGetOrders(models));
  router.patch('/admin/:id/status', authenticateToken, requireAdmin, adminUpdateOrderStatus(models));

  return router;
};

