import express from 'express';
import { getTasks, createTask, assignTask, updateTaskStatus } from '../controllers/taskController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getTasks);
router.post('/', optionalAuth, createTask);
router.put('/:id/assign', optionalAuth, assignTask);
router.put('/:id/status', optionalAuth, updateTaskStatus);

export default router;
