import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', authenticateToken, requireRole('ADMIN'), getDashboardStats);

export default router;
