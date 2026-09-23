import express from 'express';
import { addSensorReading, getSensorReadings } from '../controllers/sensorController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/reading', authenticateToken, requireRole('ADMIN', 'WORKER'), addSensorReading);
router.get('/readings', authenticateToken, requireRole('ADMIN', 'WORKER'), getSensorReadings);

export default router;
