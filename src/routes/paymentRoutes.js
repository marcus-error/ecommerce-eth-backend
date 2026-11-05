import express from 'express';
import { createPaymentOrder, verifyPayment } from '../controllers/paymentController.js';

export const createPaymentRouter = (models) => {
  const router = express.Router();

  router.post('/create-order', createPaymentOrder(models));
  router.post('/verify', verifyPayment(models));

  return router;
};

