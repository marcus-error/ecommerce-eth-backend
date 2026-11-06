import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { createAuthRouter } from './routes/authRoutes.js';
import { createProductRouter } from './routes/productRoutes.js';
import { createCategoryRouter } from './routes/categoryRoutes.js';
import { createBannerRouter } from './routes/bannerRoutes.js';
import { createOrderRouter } from './routes/orderRoutes.js';
import { createCouponRouter } from './routes/couponRoutes.js';
import { createPaymentRouter } from './routes/paymentRoutes.js';
import { createAdminRouter } from './routes/adminRoutes.js';
import { createUploadRouter } from './routes/uploadRoutes.js';
import { createReviewRouter } from './routes/reviewRoutes.js';
import { getStoreSettings } from './controllers/adminController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = (models) => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    credentials: true
  }));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Serve static uploaded media files
  const uploadDir = path.resolve(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadDir));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'The Ethnic Edit E-Commerce API',
      timestamp: new Date().toISOString()
    });
  });

  // Public store settings (contact email, phone, working hours, brand narrative)
  app.get('/api/settings', getStoreSettings(models));

  // Mount API Routers
  app.use('/api/admin/uploads', createUploadRouter());
  app.use('/api/uploads', createUploadRouter());
  app.use('/api/admin', createAdminRouter(models));
  app.use('/api/auth', createAuthRouter(models));
  app.use('/api/products', createProductRouter(models));
  app.use('/api/categories', createCategoryRouter(models));
  app.use('/api/banners', createBannerRouter(models));
  app.use('/api/orders', createOrderRouter(models));
  app.use('/api/coupons', createCouponRouter(models));
  app.use('/api/payments', createPaymentRouter(models));
  app.use('/api/reviews', createReviewRouter(models));

  // 404 handler for unknown API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: `Endpoint ${req.originalUrl} not found.` });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Express Error Handler:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  });

  return app;
};

