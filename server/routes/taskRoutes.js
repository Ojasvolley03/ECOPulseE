import express from 'express';
import { getTasks, createTask, assignTask, updateTaskStatus } from '../controllers/taskController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('ADMIN', 'WORKER'), getTasks);
router.post('/', authenticateToken, requireRole('ADMIN'), createTask);
router.put('/:id/assign', authenticateToken, requireRole('ADMIN'), assignTask);
router.put('/:id/status', authenticateToken, requireRole('ADMIN', 'WORKER'), updateTaskStatus);

export default router;
