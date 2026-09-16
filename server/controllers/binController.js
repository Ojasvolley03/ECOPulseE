import { query, queryOne, execute } from '../config/db.js';
import { calculateBinStatus, processBinReading } from '../services/binLogicService.js';
import { getSocketIO } from '../services/socketService.js';

export async function getBins(req, res) {
  try {
    const bins = await query('SELECT * FROM waste_bins ORDER BY id ASC');
    res.json({ success: true, count: bins.length, data: bins });
  } catch (err) {
    console.error('Error fetching bins:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bins.' });
  }
}

export async function getBinById(req, res) {
  try {
    const { id } = req.params;
    const bin = await queryOne('SELECT * FROM waste_bins WHERE id = ?', [id]);
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Waste bin not found.' });
    }

    const readings = await query(
      'SELECT * FROM sensor_readings WHERE bin_id = ? ORDER BY reading_time DESC LIMIT 20',
      [id]
    );

    const activeTask = await queryOne(
      `SELECT ct.*, u.name as worker_name 
       FROM collection_tasks ct 
       LEFT JOIN users u ON ct.worker_id = u.id 
       WHERE ct.bin_id = ? AND ct.status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS')`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...bin,
        readings,
        activeTask
      }
    });
  } catch (err) {
    console.error('Error fetching bin details:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bin details.' });
  }
}

export async function getBinByCode(req, res) {
  try {
    const { binCode } = req.params;
    const bin = await queryOne('SELECT * FROM waste_bins WHERE bin_code = ? OR id = ?', [binCode, binCode]);
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Waste bin not found.' });
    }

    const readings = await query(
      'SELECT * FROM sensor_readings WHERE bin_id = ? ORDER BY reading_time DESC LIMIT 20',
      [bin.id]
    );

    const activeTask = await queryOne(
      `SELECT ct.*, u.name as worker_name 
       FROM collection_tasks ct 
       LEFT JOIN users u ON ct.worker_id = u.id 
       WHERE ct.bin_id = ? AND ct.status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS')`,
      [bin.id]
    );

    const recentComplaints = await query(
      'SELECT * FROM complaints WHERE bin_id = ? ORDER BY created_at DESC LIMIT 5',
      [bin.id]
    );

    res.json({
      success: true,
      data: {
        ...bin,
        readings,
        activeTask,
        recentComplaints
      }
    });
  } catch (err) {
    console.error('Error fetching bin by code:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bin details.' });
  }
}

export async function createBin(req, res) {
  try {
    const { bin_code, address, latitude, longitude, waste_type, fill_level } = req.body;

    if (!bin_code || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Bin code, address, latitude, and longitude are required.' });
    }

    const fill = fill_level !== undefined ? Math.max(0, Math.min(100, parseInt(fill_level))) : 0;
    const status = calculateBinStatus(fill);
    const type = waste_type || 'General';

    const result = await execute(`
      INSERT INTO waste_bins (bin_code, address, latitude, longitude, fill_level, waste_type, status, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [bin_code, address, parseFloat(latitude), parseFloat(longitude), fill, type, status]);

    const newBin = await queryOne('SELECT * FROM waste_bins WHERE id = ?', [result.lastID]);

    // Record initial sensor reading
    await execute(`
      INSERT INTO sensor_readings (bin_id, fill_level, temperature, battery_level)
      VALUES (?, ?, 25.0, 100.0)
    `, [result.lastID, fill]);

    const io = getSocketIO();
    if (io) {
      io.emit('bin_created', newBin);
    }

    res.status(201).json({ success: true, message: 'Waste bin created successfully.', data: newBin });
  } catch (err) {
    console.error('Error creating bin:', err);
    res.status(500).json({ success: false, message: err.message.includes('UNIQUE') ? 'Bin code already exists.' : 'Failed to create bin.' });
  }
}

export async function updateBin(req, res) {
  try {
    const { id } = req.params;
    const { address, latitude, longitude, waste_type, fill_level } = req.body;

    const existingBin = await queryOne('SELECT * FROM waste_bins WHERE id = ?', [id]);
    if (!existingBin) {
      return res.status(404).json({ success: false, message: 'Waste bin not found.' });
    }

    if (fill_level !== undefined) {
      // Process through fill level logic service
      const result = await processBinReading(id, fill_level);
      return res.json({ success: true, message: 'Bin fill level updated.', data: result.bin });
    }

    await execute(`
      UPDATE waste_bins
      SET address = COALESCE(?, address),
          latitude = COALESCE(?, latitude),
          longitude = COALESCE(?, longitude),
          waste_type = COALESCE(?, waste_type),
          last_updated = datetime('now')
      WHERE id = ?
    `, [address, latitude, longitude, waste_type, id]);

    const updatedBin = await queryOne('SELECT * FROM waste_bins WHERE id = ?', [id]);

    const io = getSocketIO();
    if (io) {
      io.emit('bin_updated', updatedBin);
    }

    res.json({ success: true, message: 'Waste bin details updated.', data: updatedBin });
  } catch (err) {
    console.error('Error updating bin:', err);
    res.status(500).json({ success: false, message: 'Failed to update bin.' });
  }
}

export async function deleteBin(req, res) {
  try {
    const { id } = req.params;
    const bin = await queryOne('SELECT * FROM waste_bins WHERE id = ?', [id]);
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Bin not found.' });
    }

    await execute('DELETE FROM waste_bins WHERE id = ?', [id]);

    const io = getSocketIO();
    if (io) {
      io.emit('bin_deleted', { id: parseInt(id) });
    }

    res.json({ success: true, message: `Waste bin ${bin.bin_code} deleted successfully.` });
  } catch (err) {
    console.error('Error deleting bin:', err);
    res.status(500).json({ success: false, message: 'Failed to delete bin.' });
  }
}
