import express from 'express';
import { uploadSingle, uploadMultiple, deleteUpload } from '../controllers/uploadController.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

export const createUploadRouter = () => {
  const router = express.Router();

  // Admin file uploads - support both root and specific endpoints
  router.post('/', authenticateToken, requireAdmin, upload.single('image'), uploadSingle);
  router.post('/single', authenticateToken, requireAdmin, upload.single('image'), uploadSingle);
  router.post('/multiple', authenticateToken, requireAdmin, upload.array('images', 10), uploadMultiple);
  router.delete('/:filename', authenticateToken, requireAdmin, deleteUpload);

  return router;
};

