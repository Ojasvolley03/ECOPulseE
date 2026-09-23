import { query, queryOne, execute } from '../config/db.js';
import { emitToRole } from './socketService.js';

const ALERT_THRESHOLD = 90;

function buildAlertMessage(bin) {
  return [
    `Dustbin ${bin.bin_code} requires collection.`,
    `Current fill: ${bin.fill_level}%.`,
    `Location: ${bin.address}.`,
    `GPS: ${bin.latitude}, ${bin.longitude}.`,
    `Waste type: ${bin.waste_type}.`,
    `Alert time: ${new Date().toISOString()}.`
  ].join(' ');
}

export async function evaluateWorkerAlert(binId) {
  const bin = await queryOne('SELECT * FROM waste_bins WHERE id = ?', [binId]);
  if (!bin) return null;

  if (bin.fill_level <= ALERT_THRESHOLD) {
    if (bin.alert_active) {
      await execute('UPDATE waste_bins SET alert_active = 0 WHERE id = ?', [bin.id]);
    }
    return null;
  }

  const claimResult = await execute(`
    UPDATE waste_bins
    SET alert_active = 1
    WHERE id = ? AND fill_level > ? AND alert_active = 0
  `, [bin.id, ALERT_THRESHOLD]);

  if (!claimResult.changes) return null;

  const message = buildAlertMessage(bin);
  const notificationResult = await execute(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (NULL, 'Dustbin requires collection', ?, 'WORKER_CAPACITY_ALERT')
  `, [message]);

  const payload = {
    id: notificationResult.lastID,
    bin_id: bin.id,
    bin_code: bin.bin_code,
    address: bin.address,
    fill_level: bin.fill_level,
    latitude: bin.latitude,
    longitude: bin.longitude,
    waste_type: bin.waste_type,
    status: bin.status,
    timestamp: new Date().toISOString(),
    message,
    type: 'WORKER_CAPACITY_ALERT',
    read_status: 0
  };

  emitToRole('WORKER', 'worker_alert', payload);
  return payload;
}

export async function reconcileWorkerAlerts() {
  const bins = await query(
    'SELECT id FROM waste_bins WHERE fill_level > ? AND alert_active = 0',
    [ALERT_THRESHOLD]
  );

  for (const bin of bins) {
    await evaluateWorkerAlert(bin.id);
  }
}