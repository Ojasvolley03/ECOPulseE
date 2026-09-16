import express from 'express';
import { handleImageClassification, handleComplaintAnalysis, handleWastePrediction } from '../controllers/aiController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/classify-image', upload.single('image'), handleImageClassification);
router.post('/analyze-complaint', handleComplaintAnalysis);
router.get('/predict-critical', handleWastePrediction);

export default router;
