import express from 'express';
import { getTasks, createTask, assignTask, updateTaskStatus } from '../controllers/taskController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getTasks);
router.post('/', authenticateToken, requireRole('ADMIN'), createTask);
router.put('/:id/assign', authenticateToken, requireRole('ADMIN'), assignTask);
router.put('/:id/status', authenticateToken, updateTaskStatus);

export default router;
