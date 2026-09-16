import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getNotifications);
router.put('/:id/read', optionalAuth, markAsRead);

export default router;
