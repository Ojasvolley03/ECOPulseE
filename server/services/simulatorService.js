import { query } from '../config/db.js';
import { processBinReading } from './binLogicService.js';
import { getSocketIO } from './socketService.js';

let isSimulatorRunning = false;
let simulatorInterval = null;

export function startAutoSimulator(intervalSeconds = 10) {
  if (isSimulatorRunning) return;
  isSimulatorRunning = true;

  console.log(`🤖 Sensor Simulator: Auto simulation started (Interval: ${intervalSeconds}s)`);

  simulatorInterval = setInterval(async () => {
    try {
      // Pick a random non-critical bin to simulate waste accumulation
      const bins = await query("SELECT * FROM waste_bins WHERE fill_level < 98 ORDER BY RANDOM() LIMIT 1");
      if (bins && bins.length > 0) {
        const bin = bins[0];
        // Increase fill level by random 3-12%
        const fillIncrement = Math.floor(Math.random() * 10) + 3;
        const newFill = Math.min(100, bin.fill_level + fillIncrement);
        const temp = parseFloat((22 + Math.random() * 6).toFixed(1));
        const battery = parseFloat(Math.max(20, 100 - (Math.random() * 5)).toFixed(1));

        await processBinReading(bin.id, newFill, temp, battery);
        console.log(`🤖 Simulator Tick: Bin ${bin.bin_code} fill increased from ${bin.fill_level}% to ${newFill}%`);
      }
    } catch (err) {
      console.error('Error in simulator interval tick:', err);
    }
  }, intervalSeconds * 1000);

  const io = getSocketIO();
  if (io) {
    io.emit('simulator_status', { isRunning: true, intervalSeconds });
  }
}

export function stopAutoSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
  }
  isSimulatorRunning = false;
  console.log('🤖 Sensor Simulator: Auto simulation stopped.');

  const io = getSocketIO();
  if (io) {
    io.emit('simulator_status', { isRunning: false });
  }
}

export function getSimulatorStatus() {
  return { isRunning: isSimulatorRunning };
}
