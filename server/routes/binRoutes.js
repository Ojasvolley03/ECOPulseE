import express from 'express';
import { getBins, getBinById, getBinByCode, createBin, updateBin, deleteBin } from '../controllers/binController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('ADMIN', 'WORKER', 'CITIZEN'), getBins);
router.get('/code/:binCode', getBinByCode);
router.get('/:id', authenticateToken, requireRole('ADMIN', 'WORKER'), getBinById);
router.post('/', authenticateToken, requireRole('ADMIN'), createBin);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateBin);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteBin);

export default router;
