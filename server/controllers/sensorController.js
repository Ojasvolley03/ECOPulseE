import { query, queryOne } from '../config/db.js';
import { processBinReading } from '../services/binLogicService.js';

export async function addSensorReading(req, res) {
  try {
    const { bin_id, fill_level, temperature, battery_level } = req.body;

    if (!bin_id || fill_level === undefined) {
      return res.status(400).json({ success: false, message: 'bin_id and fill_level are required.' });
    }

    const result = await processBinReading(
      bin_id,
      parseFloat(fill_level),
      temperature !== undefined ? parseFloat(temperature) : 25.0,
      battery_level !== undefined ? parseFloat(battery_level) : 100.0
    );

    res.status(201).json({
      success: true,
      message: 'Sensor reading recorded.',
      data: result.bin,
      taskCreated: result.taskCreated
    });
  } catch (err) {
    console.error('Error adding sensor reading:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to process sensor reading.' });
  }
}

export async function getSensorReadings(req, res) {
  try {
    const { bin_id, limit = 50 } = req.query;

    let sql = `
      SELECT sr.*, wb.bin_code, wb.address 
      FROM sensor_readings sr
      JOIN waste_bins wb ON sr.bin_id = wb.id
    `;
    const params = [];

    if (req.user.role === 'WORKER' && bin_id) {
      const assignment = await queryOne(
        "SELECT id FROM collection_tasks WHERE bin_id = ? AND worker_id = ? AND status != 'COMPLETED'",
        [bin_id, req.user.id]
      );
      if (!assignment) return res.status(403).json({ success: false, message: 'Bin is not assigned to this worker.' });
    }

    if (bin_id) {
      sql += ' WHERE sr.bin_id = ?';
      params.push(bin_id);
    } else if (req.user.role === 'WORKER') {
      sql += ` WHERE EXISTS (
        SELECT 1 FROM collection_tasks ct
        WHERE ct.bin_id = sr.bin_id AND ct.worker_id = ? AND ct.status != 'COMPLETED'
      )`;
      params.push(req.user.id);
    }

    sql += ' ORDER BY sr.reading_time DESC LIMIT ?';
    params.push(parseInt(limit));

    const readings = await query(sql, params);
    res.json({ success: true, count: readings.length, data: readings });
  } catch (err) {
    console.error('Error fetching sensor readings:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve sensor readings.' });
  }
}
