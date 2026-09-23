import { query, execute } from '../config/db.js';

export async function getNotifications(req, res) {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT * FROM notifications
      WHERE type = 'WORKER_CAPACITY_ALERT'
        AND (user_id IS NULL OR user_id = ?)
      ORDER BY created_at DESC 
      LIMIT 50
    `;

    const notifications = await query(sql, [userId]);
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    await execute('UPDATE notifications SET read_status = 1 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}
