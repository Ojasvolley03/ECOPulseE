import express from 'express';
import { getBins, getBinById, getBinByCode, createBin, updateBin, deleteBin } from '../controllers/binController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getBins);
router.get('/code/:binCode', getBinByCode);
router.get('/:id', getBinById);
router.post('/', optionalAuth, createBin);
router.put('/:id', optionalAuth, updateBin);
router.delete('/:id', optionalAuth, deleteBin);

export default router;
