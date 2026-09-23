import test from 'node:test';
import assert from 'node:assert/strict';
import { query, queryOne, execute } from '../config/db.js';
import { evaluateWorkerAlert } from './workerAlertService.js';

test('worker alerts deduplicate and re-arm after a reset', async () => {
  const bin = await queryOne('SELECT * FROM waste_bins ORDER BY id LIMIT 1');
  assert.ok(bin, 'a seeded bin is required for the alert integration test');

  const original = { fill_level: bin.fill_level, status: bin.status, alert_active: bin.alert_active };

  try {
    await execute("DELETE FROM notifications WHERE type = 'WORKER_CAPACITY_ALERT'");
    await execute("DELETE FROM outbox_events WHERE event_type = 'worker_alert'");
    await execute("UPDATE waste_bins SET fill_level = 95, status = 'CRITICAL', alert_active = 0 WHERE id = ?", [bin.id]);

    const firstAlert = await evaluateWorkerAlert(bin.id);
    const duplicateAlert = await evaluateWorkerAlert(bin.id);
    assert.ok(firstAlert, 'the first crossing should create an alert');
    assert.equal(duplicateAlert, null, 'repeated readings above the threshold must not duplicate alerts');

    const firstCount = await queryOne("SELECT COUNT(*) AS count FROM notifications WHERE type = 'WORKER_CAPACITY_ALERT'");
    assert.equal(firstCount.count, 1);

    await execute("UPDATE waste_bins SET fill_level = 0, status = 'NORMAL' WHERE id = ?", [bin.id]);
    await evaluateWorkerAlert(bin.id);
    await execute("UPDATE waste_bins SET fill_level = 96, status = 'CRITICAL' WHERE id = ?", [bin.id]);
    const secondAlert = await evaluateWorkerAlert(bin.id);
    assert.ok(secondAlert, 'a reset bin should alert again on a new crossing');
  } finally {
    await execute("DELETE FROM notifications WHERE type = 'WORKER_CAPACITY_ALERT'");
    await execute("DELETE FROM outbox_events WHERE event_type = 'worker_alert'");
    await execute('UPDATE waste_bins SET fill_level = ?, status = ?, alert_active = ? WHERE id = ?', [original.fill_level, original.status, original.alert_active, bin.id]);
  }
});