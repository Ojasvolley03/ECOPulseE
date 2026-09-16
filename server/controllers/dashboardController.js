import { query, queryOne } from '../config/db.js';

export async function getDashboardStats(req, res) {
  try {
    // 1. Bin Stats
    const binStats = await queryOne(`
      SELECT 
        COUNT(*) as total_bins,
        SUM(CASE WHEN status = 'NORMAL' THEN 1 ELSE 0 END) as normal_bins,
        SUM(CASE WHEN status = 'MEDIUM' THEN 1 ELSE 0 END) as medium_bins,
        SUM(CASE WHEN status = 'NEARLY_FULL' THEN 1 ELSE 0 END) as nearly_full_bins,
        SUM(CASE WHEN status = 'CRITICAL' THEN 1 ELSE 0 END) as critical_bins,
        AVG(fill_level) as average_fill_level
      FROM waste_bins
    `);

    // 2. Task Stats
    const taskStats = await queryOne(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS') THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN priority = 'CRITICAL' AND status != 'COMPLETED' THEN 1 ELSE 0 END) as critical_tasks
      FROM collection_tasks
    `);

    // 3. Worker Stats
    const workerStats = await queryOne(`
      SELECT COUNT(*) as active_workers FROM users WHERE role = 'WORKER'
    `);

    // 4. Complaint Stats
    const complaintStats = await queryOne(`
      SELECT 
        COUNT(*) as total_complaints,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_complaints,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_complaints,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved_complaints
      FROM complaints
    `);

    // 5. Waste Type Breakdown
    const wasteTypeBreakdown = await query(`
      SELECT waste_type, COUNT(*) as count, AVG(fill_level) as avg_fill
      FROM waste_bins
      GROUP BY waste_type
    `);

    // 6. Recent Activity Feed (Combine recent complaints & tasks)
    const recentCriticalBins = await query(`
      SELECT id, bin_code, address, fill_level, status, last_updated 
      FROM waste_bins 
      WHERE status = 'CRITICAL' 
      ORDER BY last_updated DESC
    `);

    const recentComplaints = await query(`
      SELECT c.*, u.name as citizen_name 
      FROM complaints c 
      JOIN users u ON c.user_id = u.id 
      ORDER BY c.created_at DESC 
      LIMIT 5
    `);

    const recentTasks = await query(`
      SELECT ct.*, wb.bin_code, u.name as worker_name 
      FROM collection_tasks ct
      JOIN waste_bins wb ON ct.bin_id = wb.id
      LEFT JOIN users u ON ct.worker_id = u.id
      ORDER BY ct.created_at DESC 
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        bins: {
          total: binStats.total_bins || 0,
          normal: binStats.normal_bins || 0,
          medium: binStats.medium_bins || 0,
          nearlyFull: binStats.nearly_full_bins || 0,
          critical: binStats.critical_bins || 0,
          averageFill: Math.round(binStats.average_fill_level || 0)
        },
        tasks: {
          total: taskStats.total_tasks || 0,
          pending: taskStats.pending_tasks || 0,
          completed: taskStats.completed_tasks || 0,
          critical: taskStats.critical_tasks || 0
        },
        workers: {
          active: workerStats.active_workers || 0
        },
        complaints: {
          total: complaintStats.total_complaints || 0,
          pending: complaintStats.pending_complaints || 0,
          inProgress: complaintStats.in_progress_complaints || 0,
          resolved: complaintStats.resolved_complaints || 0
        },
        wasteTypeBreakdown,
        recentCriticalBins,
        recentComplaints,
        recentTasks
      }
    });
  } catch (err) {
    console.error('Error compiling dashboard stats:', err);
    res.status(500).json({ success: false, message: 'Failed to compile dashboard statistics.' });
  }
}
