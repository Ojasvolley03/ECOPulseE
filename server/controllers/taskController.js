import { query, queryOne, execute } from '../config/db.js';
import { getSocketIO } from '../services/socketService.js';
import { processBinReading } from '../services/binLogicService.js';

export async function getTasks(req, res) {
  try {
    const { status, worker_id, bin_id } = req.query;

    let sql = `
      SELECT ct.*, 
             wb.bin_code, wb.address, wb.latitude, wb.longitude, wb.fill_level, wb.status as bin_status, wb.waste_type,
             u.name as worker_name, u.email as worker_email, u.phone as worker_phone
      FROM collection_tasks ct
      JOIN waste_bins wb ON ct.bin_id = wb.id
      LEFT JOIN users u ON ct.worker_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user && req.user.role === 'WORKER') {
      sql += ' AND ct.worker_id = ?';
      params.push(req.user.id);
    } else if (worker_id) {
      sql += ' AND ct.worker_id = ?';
      params.push(worker_id);
    }

    if (status) {
      sql += ' AND ct.status = ?';
      params.push(status);
    }

    if (bin_id) {
      sql += ' AND ct.bin_id = ?';
      params.push(bin_id);
    }

    sql += ` ORDER BY 
      CASE ct.priority
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        ELSE 4
      END, ct.created_at DESC`;

    const tasks = await query(sql, params);
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    console.error('Error fetching collection tasks:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve tasks.' });
  }
}

export async function createTask(req, res) {
  try {
    const { bin_id, worker_id, priority } = req.body;

    if (!bin_id) {
      return res.status(400).json({ success: false, message: 'bin_id is required.' });
    }

    const bin = await queryOne('SELECT * FROM waste_bins WHERE id = ?', [bin_id]);
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Waste bin not found.' });
    }

    const taskPriority = priority || (bin.status === 'CRITICAL' ? 'CRITICAL' : 'HIGH');
    const taskStatus = worker_id ? 'ASSIGNED' : 'PENDING';
    const assignmentTime = worker_id ? new Date().toISOString() : null;

    const result = await execute(`
      INSERT INTO collection_tasks (bin_id, worker_id, priority, status, assignment_time, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [bin_id, worker_id ? parseInt(worker_id) : null, taskPriority, taskStatus, assignmentTime]);

    const newTask = await queryOne(`
      SELECT ct.*, 
             wb.bin_code, wb.address, wb.latitude, wb.longitude, wb.fill_level, wb.status as bin_status, wb.waste_type,
             u.name as worker_name, u.email as worker_email
      FROM collection_tasks ct
      JOIN waste_bins wb ON ct.bin_id = wb.id
      LEFT JOIN users u ON ct.worker_id = u.id
      WHERE ct.id = ?
    `, [result.lastID]);

    if (worker_id) {
      await execute(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, 'New Collection Task Assigned', ?, 'TASK_ASSIGNED')
      `, [worker_id, `You have been assigned to collect bin ${bin.bin_code} at ${bin.address}.`]);
    }

    const io = getSocketIO();
    if (io) {
      io.emit('task_created', newTask);
    }

    res.status(201).json({ success: true, message: 'Collection task created.', data: newTask });
  } catch (err) {
    console.error('Error creating collection task:', err);
    res.status(500).json({ success: false, message: 'Failed to create collection task.' });
  }
}

export async function assignTask(req, res) {
  try {
    const { id } = req.params;
    const { worker_id } = req.body;

    if (!worker_id) {
      return res.status(400).json({ success: false, message: 'worker_id is required.' });
    }

    const task = await queryOne('SELECT * FROM collection_tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const worker = await queryOne("SELECT * FROM users WHERE id = ? AND role = 'WORKER'", [worker_id]);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    await execute(`
      UPDATE collection_tasks
      SET worker_id = ?, status = 'ASSIGNED', assignment_time = datetime('now')
      WHERE id = ?
    `, [worker_id, id]);

    const updatedTask = await queryOne(`
      SELECT ct.*, 
             wb.bin_code, wb.address, wb.latitude, wb.longitude, wb.fill_level, wb.status as bin_status, wb.waste_type,
             u.name as worker_name, u.email as worker_email
      FROM collection_tasks ct
      JOIN waste_bins wb ON ct.bin_id = wb.id
      LEFT JOIN users u ON ct.worker_id = u.id
      WHERE ct.id = ?
    `, [id]);

    await execute(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, 'Task Assigned', ?, 'TASK_ASSIGNED')
    `, [worker_id, `Assigned to collection task for bin ${updatedTask.bin_code}.`]);

    const io = getSocketIO();
    if (io) {
      io.emit('task_assigned', updatedTask);
    }

    res.json({ success: true, message: 'Worker assigned successfully.', data: updatedTask });
  } catch (err) {
    console.error('Error assigning task:', err);
    res.status(500).json({ success: false, message: 'Failed to assign worker to task.' });
  }
}

export async function updateTaskStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const task = await queryOne('SELECT * FROM collection_tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (req.user.role === 'WORKER' && task.worker_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Task is not assigned to this worker.' });
    }

    let completionTime = task.completion_time;
    if (status === 'COMPLETED') {
      completionTime = new Date().toISOString();
    }

    await execute(`
      UPDATE collection_tasks
      SET status = ?, completion_time = COALESCE(?, completion_time)
      WHERE id = ?
    `, [status, completionTime, id]);

    // If marked COMPLETED, automatically empty the bin to 0%
    if (status === 'COMPLETED') {
      await processBinReading(task.bin_id, 0); // resets bin to 0% NORMAL
    }

    const updatedTask = await queryOne(`
      SELECT ct.*, 
             wb.bin_code, wb.address, wb.latitude, wb.longitude, wb.fill_level, wb.status as bin_status, wb.waste_type,
             u.name as worker_name, u.email as worker_email
      FROM collection_tasks ct
      JOIN waste_bins wb ON ct.bin_id = wb.id
      LEFT JOIN users u ON ct.worker_id = u.id
      WHERE ct.id = ?
    `, [id]);

    if (status === 'COMPLETED') {
      await execute(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (NULL, 'Task Completed', ?, 'TASK_COMPLETED')
      `, [`Bin ${updatedTask.bin_code} collected & emptied by ${updatedTask.worker_name || 'Worker'}.`]);
    }

    const io = getSocketIO();
    if (io) {
      io.emit('task_status_changed', updatedTask);
    }

    res.json({ success: true, message: `Task status updated to ${status}.`, data: updatedTask });
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({ success: false, message: 'Failed to update task status.' });
  }
}
