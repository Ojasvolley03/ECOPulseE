import express from 'express';
import { startAutoSimulator, stopAutoSimulator, getSimulatorStatus } from '../services/simulatorService.js';
import { processBinReading } from '../services/binLogicService.js';

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ success: true, ...getSimulatorStatus() });
});

router.post('/start', (req, res) => {
  const { interval } = req.body;
  startAutoSimulator(interval ? parseInt(interval) : 8);
  res.json({ success: true, message: 'Auto sensor simulator started.', isRunning: true });
});

router.post('/stop', (req, res) => {
  stopAutoSimulator();
  res.json({ success: true, message: 'Auto sensor simulator stopped.', isRunning: false });
});

router.post('/manual-update', async (req, res) => {
  try {
    const { bin_id, fill_level, temperature, battery_level } = req.body;
    if (!bin_id || fill_level === undefined) {
      return res.status(400).json({ success: false, message: 'bin_id and fill_level are required.' });
    }

    const result = await processBinReading(
      bin_id,
      parseFloat(fill_level),
      temperature ? parseFloat(temperature) : 26.5,
      battery_level ? parseFloat(battery_level) : 95.0
    );

    res.json({ success: true, message: 'Bin sensor simulated manually.', data: result.bin, taskCreated: result.taskCreated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Simulation update failed.' });
  }
});

export default router;
