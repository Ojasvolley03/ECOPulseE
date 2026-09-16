import { query, queryOne, execute } from '../config/db.js';
import { analyzeComplaintText } from '../services/aiService.js';
import { getSocketIO } from '../services/socketService.js';

export async function createComplaint(req, res) {
  try {
    const { citizen_name, name, phone, description, location_address, bin_id, priority, latitude, longitude } = req.body;
    const authorName = citizen_name || name || (req.user ? req.user.name : 'Anonymous Citizen');
    const authorPhone = phone || (req.user ? req.user.phone : null);
    const userId = req.user ? req.user.id : (req.body.user_id || 5);

    if (!description || !location_address) {
      return res.status(400).json({ success: false, message: 'Description and location address are required.' });
    }

    let imageUrl = req.body.image_url || null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Run AI Complaint text analyzer if priority not explicitly set
    let finalPriority = priority || 'MEDIUM';
    let aiAnalysis = null;
    if (!priority) {
      aiAnalysis = await analyzeComplaintText(description);
      if (aiAnalysis && aiAnalysis.priority) {
        finalPriority = aiAnalysis.priority;
      }
    }

    // Ensure citizen_name and citizen_phone columns exist in database
    try {
      await execute('ALTER TABLE complaints ADD COLUMN citizen_name TEXT');
    } catch (e) {}
    try {
      await execute('ALTER TABLE complaints ADD COLUMN citizen_phone TEXT');
    } catch (e) {}

    const result = await execute(`
      INSERT INTO complaints (user_id, bin_id, citizen_name, citizen_phone, description, image_url, location_address, latitude, longitude, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `, [
      userId,
      bin_id ? parseInt(bin_id) : null,
      authorName,
      authorPhone,
      description,
      imageUrl,
      location_address,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      finalPriority
    ]);

    const newComplaint = await queryOne(`
      SELECT c.*, COALESCE(c.citizen_name, u.name) as citizen_name, u.email as citizen_email, wb.bin_code
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN waste_bins wb ON c.bin_id = wb.id
      WHERE c.id = ?
    `, [result.lastID]);

    // Create Notification for Admin & Workers
    await execute(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (NULL, 'New Citizen Complaint Filed', ?, 'NEW_COMPLAINT')
    `, [`Citizen ${authorName} reported issue at ${location_address}: "${description.substring(0, 50)}..."`]);

    const io = getSocketIO();
    if (io) {
      io.emit('complaint_created', newComplaint);
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      data: newComplaint,
      aiAnalysis
    });
  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ success: false, message: 'Failed to submit complaint.' });
  }
}

export async function getComplaints(req, res) {
  try {
    const { status, user_id, priority } = req.query;

    let sql = `
      SELECT c.*, COALESCE(c.citizen_name, u.name, 'Citizen') as citizen_name, u.email as citizen_email, COALESCE(c.citizen_phone, u.phone) as citizen_phone, wb.bin_code
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN waste_bins wb ON c.bin_id = wb.id
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      sql += ' AND c.user_id = ?';
      params.push(user_id);
    }

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    if (priority) {
      sql += ' AND c.priority = ?';
      params.push(priority);
    }

    sql += ' ORDER BY c.created_at DESC';

    const complaints = await query(sql, params);
    res.json({ success: true, count: complaints.length, data: complaints });
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve complaints.' });
  }
}

export async function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const complaint = await queryOne('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    await execute(`
      UPDATE complaints
      SET status = COALESCE(?, status),
          priority = COALESCE(?, priority)
      WHERE id = ?
    `, [status, priority, id]);

    const updatedComplaint = await queryOne(`
      SELECT c.*, u.name as citizen_name, u.email as citizen_email, wb.bin_code
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN waste_bins wb ON c.bin_id = wb.id
      WHERE c.id = ?
    `, [id]);

    const io = getSocketIO();
    if (io) {
      io.emit('complaint_updated', updatedComplaint);
    }

    res.json({ success: true, message: 'Complaint updated successfully.', data: updatedComplaint });
  } catch (err) {
    console.error('Error updating complaint:', err);
    res.status(500).json({ success: false, message: 'Failed to update complaint.' });
  }
}
