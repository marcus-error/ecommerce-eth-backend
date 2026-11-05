import express from 'express';
import {
  getDashboardStats,
  getInventoryOverview,
  adjustStock,
  getCustomers,
  toggleCustomerStatus,
  getStoreSettings,
  updateStoreSettings
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

export const createAdminRouter = (models) => {
  const router = express.Router();

  // Protect all admin routes
  router.use(authenticateToken, requireAdmin);

  router.get('/dashboard', getDashboardStats(models));
  router.get('/inventory', getInventoryOverview(models));
  router.post('/inventory/adjust', adjustStock(models));
  router.get('/customers', getCustomers(models));
  router.patch('/customers/:id/toggle', toggleCustomerStatus(models));
  router.get('/settings', getStoreSettings(models));
  router.put('/settings', updateStoreSettings(models));

  return router;
};

