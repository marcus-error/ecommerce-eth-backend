import express from 'express';
import { uploadSingle, uploadMultiple, deleteUpload } from '../controllers/uploadController.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { getCloudinaryClient } from '../config/cloudinary.js';

export const createUploadRouter = () => {
  const router = express.Router();

  // Diagnostic route to check Cloudinary connectivity status
  router.get('/cloudinary-status', async (req, res) => {
    const { cloudinary, isConfigured } = getCloudinaryClient();
    if (!isConfigured) {
      return res.json({
        success: false,
        connected: false,
        message: 'Cloudinary credentials missing in .env.'
      });
    }
    try {
      const ping = await cloudinary.api.ping();
      return res.json({
        success: true,
        connected: true,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        ping
      });
    } catch (e) {
      return res.json({
        success: false,
        connected: false,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        error: e.message,
        hint: e.message?.includes('cloud_name mismatch')
          ? 'The CLOUDINARY_CLOUD_NAME in .env does not match the account for this API key. In your Cloudinary dashboard, copy your exact Cloud Name and replace "website" in backend/.env.'
          : e.message
      });
    }
  });

  // Public file upload for customer reviews & feedback
  router.post('/public', upload.single('image'), uploadSingle);

  // Admin file uploads - support both root and specific endpoints
  router.post('/', authenticateToken, requireAdmin, upload.single('image'), uploadSingle);
  router.post('/single', authenticateToken, requireAdmin, upload.single('image'), uploadSingle);
  router.post('/multiple', authenticateToken, requireAdmin, upload.array('images', 10), uploadMultiple);
  router.delete('/:filename', authenticateToken, requireAdmin, deleteUpload);

  return router;
};

