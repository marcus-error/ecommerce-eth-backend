import express from 'express';
import {
  getProducts,
  getProductById,
  adminGetProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  togglePublish
} from '../controllers/productController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

export const createProductRouter = (models) => {
  const router = express.Router();

  // Admin routes MUST be declared before /:id wildcard
  router.get('/admin/all', authenticateToken, requireAdmin, adminGetProducts(models));
  router.get('/admin', authenticateToken, requireAdmin, adminGetProducts(models));
  router.post('/admin', authenticateToken, requireAdmin, createProduct(models));
  router.put('/admin/:id', authenticateToken, requireAdmin, updateProduct(models));
  router.delete('/admin/:id', authenticateToken, requireAdmin, deleteProduct(models));
  router.patch('/admin/:id/publish', authenticateToken, requireAdmin, togglePublish(models));

  // Public routes
  router.get('/', getProducts(models));
  router.get('/:id', getProductById(models));

  return router;
};

