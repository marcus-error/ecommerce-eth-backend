import express from 'express';
import {
  getCategories,
  adminGetCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

export const createCategoryRouter = (models) => {
  const router = express.Router();

  router.get('/', getCategories(models));
  router.get('/admin/all', authenticateToken, requireAdmin, adminGetCategories(models));
  router.post('/admin', authenticateToken, requireAdmin, createCategory(models));
  router.put('/admin/:id', authenticateToken, requireAdmin, updateCategory(models));
  router.delete('/admin/:id', authenticateToken, requireAdmin, deleteCategory(models));

  return router;
};

