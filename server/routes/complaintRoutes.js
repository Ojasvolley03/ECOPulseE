import express from 'express';
import { createComplaint, getComplaints, updateComplaintStatus } from '../controllers/complaintController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getComplaints);
router.post('/', authenticateToken, upload.single('image'), createComplaint);
router.put('/:id/status', authenticateToken, requireRole('ADMIN', 'WORKER'), updateComplaintStatus);

export default router;
