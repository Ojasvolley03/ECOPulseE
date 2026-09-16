import express from 'express';
import { getBins, getBinById, createBin, updateBin, deleteBin } from '../controllers/binController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getBins);
router.get('/:id', getBinById);
router.post('/', authenticateToken, requireRole('ADMIN'), createBin);
router.put('/:id', authenticateToken, updateBin);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteBin);

export default router;
