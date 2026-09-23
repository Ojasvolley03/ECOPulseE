import express from 'express';
import { register, login, getMe, getAdminStatus, setupAdmin, changeAdminCredentials } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getGuestAccess } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/guest-access', getGuestAccess);
router.get('/admin-status', getAdminStatus);
router.post('/setup-admin', setupAdmin);
router.get('/me', authenticateToken, getMe);
router.post('/change-admin-credentials', authenticateToken, changeAdminCredentials);

export default router;
