import express from 'express';
import { createReviewController } from '../controllers/reviewController.js';

export const createReviewRouter = (models) => {
  const router = express.Router();
  const controller = createReviewController(models);

  router.get('/', controller.getReviews);
  router.post('/', controller.createReview);

  return router;
};

