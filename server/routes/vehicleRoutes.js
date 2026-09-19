import express from 'express';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, updateVehicleLocation, getOptimizedRoute } from '../controllers/vehicleController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getVehicles);
router.get('/route', getOptimizedRoute);
router.post('/', optionalAuth, createVehicle);
router.put('/:id', optionalAuth, updateVehicle);
router.delete('/:id', optionalAuth, deleteVehicle);
router.put('/:id/location', updateVehicleLocation);

export default router;
