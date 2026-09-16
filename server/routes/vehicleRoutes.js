import express from 'express';
import { getVehicles, updateVehicleLocation, getOptimizedRoute } from '../controllers/vehicleController.js';

const router = express.Router();

router.get('/', getVehicles);
router.get('/route', getOptimizedRoute);
router.put('/:id/location', updateVehicleLocation);

export default router;
