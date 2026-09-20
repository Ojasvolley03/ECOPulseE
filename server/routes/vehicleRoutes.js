import express from 'express';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, updateVehicleLocation, getOptimizedRoute } from '../controllers/vehicleController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('ADMIN'), getVehicles);
router.get('/route', authenticateToken, requireRole('ADMIN'), getOptimizedRoute);
router.post('/', authenticateToken, requireRole('ADMIN'), createVehicle);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateVehicle);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteVehicle);
router.put('/:id/location', authenticateToken, requireRole('ADMIN', 'WORKER'), updateVehicleLocation);

export default router;
