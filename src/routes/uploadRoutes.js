import express from 'express';
import {
  uploadSingle,
  uploadMultiple,
  testCloudinaryEndpoint,
  deleteImageEndpoint
} from '../controllers/uploadController.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { getCloudinaryClient, testCloudinaryConnection } from '../config/cloudinary.js';

export const createUploadRouter = () => {
  const router = express.Router();

  // Diagnostic route to check Cloudinary connectivity status
  router.get('/cloudinary-status', async (req, res) => {
    const result = await testCloudinaryConnection();
    return res.json(result);
  });

  // Admin test connection endpoint
  router.post('/test-connection', testCloudinaryEndpoint);

  // Public file upload for customer reviews & feedback
  router.post('/public', upload.single('image'), uploadSingle);

  // Admin file uploads - support both root and specific endpoints
  router.post('/', authenticateToken, requireAdmin, upload.single('image'), uploadSingle);
  router.post('/single', authenticateToken, requireAdmin, upload.single('image'), uploadSingle);
  router.post('/multiple', authenticateToken, requireAdmin, upload.array('images', 10), uploadMultiple);

  // Delete image endpoint
  router.delete('/', authenticateToken, requireAdmin, deleteImageEndpoint);
  router.post('/delete', authenticateToken, requireAdmin, deleteImageEndpoint);

  return router;
};
