import express from 'express';
import { addSensorReading, getSensorReadings } from '../controllers/sensorController.js';

const router = express.Router();

router.post('/reading', addSensorReading);
router.get('/readings', getSensorReadings);

export default router;
