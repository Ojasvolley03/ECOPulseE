import { query } from '../config/db.js';

export async function getUsers(req, res) {
  try {
    const { role } = req.query;
    let sql = 'SELECT id, name, email, phone, role, created_at FROM users';
    const params = [];

    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }

    sql += ' ORDER BY created_at DESC';

    const users = await query(sql, params);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
}

export async function getWorkers(req, res) {
  try {
    const workers = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
             COUNT(CASE WHEN ct.status IN ('ASSIGNED', 'IN_PROGRESS') THEN 1 END) as active_tasks_count,
             COUNT(CASE WHEN ct.status = 'COMPLETED' THEN 1 END) as completed_tasks_count
      FROM users u
      LEFT JOIN collection_tasks ct ON u.id = ct.worker_id
      WHERE u.role = 'WORKER'
      GROUP BY u.id
      ORDER BY active_tasks_count ASC, u.name ASC
    `);

    res.json({ success: true, count: workers.length, data: workers });
  } catch (err) {
    console.error('Error fetching workers:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve workers.' });
  }
}
