import express from 'express';
import { getUsers, getWorkers } from '../controllers/userController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('ADMIN'), getUsers);
router.get('/workers', authenticateToken, getWorkers);

export default router;
