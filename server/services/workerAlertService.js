import { query, queryOne, execute, withTransaction } from '../config/db.js';
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

  const message = buildAlertMessage(bin);
  const timestamp = new Date().toISOString();
  const payload = await withTransaction(async () => {
    const claimResult = await execute(`
      UPDATE waste_bins
      SET alert_active = 1
      WHERE id = ? AND fill_level > ? AND alert_active = 0
    `, [bin.id, ALERT_THRESHOLD]);

    if (!claimResult.changes) return null;

    const notificationResult = await execute(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (NULL, 'Dustbin requires collection', ?, 'WORKER_CAPACITY_ALERT')
    `, [message]);

    const alertPayload = {
      id: notificationResult.lastID,
      bin_id: bin.id,
      bin_code: bin.bin_code,
      address: bin.address,
      fill_level: bin.fill_level,
      latitude: bin.latitude,
      longitude: bin.longitude,
      waste_type: bin.waste_type,
      status: bin.status,
      timestamp,
      message,
      type: 'WORKER_CAPACITY_ALERT',
      read_status: 0
    };

    await execute(`
      INSERT INTO outbox_events (event_type, aggregate_type, aggregate_id, payload)
      VALUES ('worker_alert', 'waste_bin', ?, ?)
    `, [bin.id, JSON.stringify(alertPayload)]);

    return alertPayload;
  });

  if (!payload) return null;

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