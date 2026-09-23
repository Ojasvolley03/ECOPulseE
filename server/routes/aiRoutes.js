import express from 'express';
import { handleImageClassification, handleComplaintAnalysis, handleWastePrediction } from '../controllers/aiController.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/classify-image', authenticateToken, upload.single('image'), handleImageClassification);
router.post('/analyze-complaint', authenticateToken, handleComplaintAnalysis);
router.get('/predict-critical', authenticateToken, handleWastePrediction);

export default router;
