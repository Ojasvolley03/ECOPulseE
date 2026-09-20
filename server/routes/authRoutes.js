import express from 'express';
import { register, login, getMe, getAdminStatus, getPublicAdminAccess, setupAdmin, changeAdminCredentials } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/admin-status', getAdminStatus);
router.get('/admin-access', getPublicAdminAccess);
router.post('/setup-admin', setupAdmin);
router.get('/me', authenticateToken, getMe);
router.post('/change-admin-credentials', authenticateToken, changeAdminCredentials);

export default router;
