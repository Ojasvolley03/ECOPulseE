import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.put('/:id/read', authenticateToken, markAsRead);

export default router;
