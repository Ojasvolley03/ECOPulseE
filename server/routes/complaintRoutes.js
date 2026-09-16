import express from 'express';
import { createComplaint, getComplaints, updateComplaintStatus } from '../controllers/complaintController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getComplaints);
router.post('/', optionalAuth, upload.single('image'), createComplaint);
router.put('/:id/status', optionalAuth, updateComplaintStatus);

export default router;
