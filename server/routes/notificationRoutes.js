import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('WORKER'), getNotifications);
router.put('/:id/read', authenticateToken, requireRole('WORKER'), markAsRead);

export default router;
