import { query, queryOne, execute } from '../config/db.js';
import { getSocketIO } from './socketService.js';
import { evaluateWorkerAlert } from './workerAlertService.js';

/**
 * Calculates bin status based on fill level:
 * 0–50% → NORMAL
 * 51–75% → MEDIUM
 * 76–90% → NEARLY_FULL
 * 91–100% → CRITICAL
 */
export function calculateBinStatus(fillLevel) {
  if (fillLevel <= 50) return 'NORMAL';
  if (fillLevel <= 75) return 'MEDIUM';
  if (fillLevel <= 90) return 'NEARLY_FULL';
  return 'CRITICAL';
}

/**
 * Processes a sensor reading update for a bin, updates bin state,
 * handles collection tasks, worker alerts, and emits web sockets.
 */
export async function processBinReading(binId, fillLevel, temperature = 25.0, batteryLevel = 100.0) {
  const normalizedFill = Math.max(0, Math.min(100, Math.round(fillLevel)));
  const newStatus = calculateBinStatus(normalizedFill);

  const oldBin = await queryOne('SELECT * FROM waste_bins WHERE id = ?', [binId]);
  if (!oldBin) {
    throw new Error(`Bin with ID ${binId} not found.`);
  }

  // 1. Record sensor reading
  await execute(`
    INSERT INTO sensor_readings (bin_id, fill_level, temperature, battery_level, reading_time)
    VALUES (?, ?, ?, ?, datetime('now'))
  `, [binId, normalizedFill, temperature, batteryLevel]);

  // 2. Update waste bin record
  await execute(`
    UPDATE waste_bins
    SET fill_level = ?, status = ?, last_updated = datetime('now')
    WHERE id = ?
  `, [normalizedFill, newStatus, binId]);

  const updatedBin = await queryOne('SELECT * FROM waste_bins WHERE id = ?', [binId]);

  const io = getSocketIO();

  await evaluateWorkerAlert(binId);

  // 3. Auto-create a collection task for bins needing collection.
  let createdTask = null;
  if (normalizedFill >= 75) {
    // Check if an unresolved collection task already exists for this bin
    const existingTask = await queryOne(`
      SELECT id FROM collection_tasks 
      WHERE bin_id = ? AND status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS')
    `, [binId]);

    if (!existingTask) {
      const priorityLevel = normalizedFill > 90 ? 'CRITICAL' : 'HIGH';
      const taskResult = await execute(`
        INSERT INTO collection_tasks (bin_id, priority, status, created_at)
        VALUES (?, ?, 'PENDING', datetime('now'))
      `, [binId, priorityLevel]);

      createdTask = await queryOne(`
        SELECT ct.*, wb.bin_code, wb.address, wb.latitude, wb.longitude, wb.fill_level
        FROM collection_tasks ct
        JOIN waste_bins wb ON ct.bin_id = wb.id
        WHERE ct.id = ?
      `, [taskResult.lastID]);
    }

    if (io) {
      if (normalizedFill > 90) {
        io.to('role:ADMIN').emit('critical_alert', {
        bin: updatedBin,
        task: createdTask,
        message: `Dustbin ${updatedBin.bin_code} requires collection at ${normalizedFill}% capacity.`
        });
      }
      if (createdTask) {
        io.to('role:ADMIN').emit('task_created', createdTask);
      }
    }
  }

  // 4. Emit live bin status update to all connected clients
  if (io) {
    io.emit('bin_updated', updatedBin);
  }

  return { bin: updatedBin, taskCreated: createdTask };
}
