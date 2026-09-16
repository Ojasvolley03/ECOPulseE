import React, { useState, useEffect } from 'react';
import { PriorityBadge, TaskStatusBadge, StatusBadge } from '../components/common/Badge';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { ClipboardList, MapPin, Play, CheckCircle2, Navigation, AlertTriangle, RefreshCw } from 'lucide-react';

export default function WorkerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleTaskChange = () => fetchTasks();
    socket.on('task_created', handleTaskChange);
    socket.on('task_assigned', handleTaskChange);
    socket.on('task_status_changed', handleTaskChange);

    return () => {
      socket.off('task_created', handleTaskChange);
      socket.off('task_assigned', handleTaskChange);
      socket.off('task_status_changed', handleTaskChange);
    };
  }, [socket]);

  const fetchTasks = async () => {
    try {
      const res = await api.getTasks();
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Error fetching worker tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const res = await api.updateTaskStatus(taskId, newStatus);
      if (res.success) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const activeTasks = tasks.filter(t => t.status !== 'COMPLETED');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  return (
    <div className="space-y-6 pb-12">
      
      {/* Worker Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 to-slate-900 border border-purple-500/20 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Collection Driver Portal</h1>
          <p className="text-xs text-slate-300 mt-1">
            Active dispatch routes & automated bin reset workflow.
          </p>
        </div>

        <button
          onClick={fetchTasks}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Active Tasks Queue */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <ClipboardList className="w-5 h-5 text-purple-400" />
          <span>Assigned Collection Tasks ({activeTasks.length})</span>
        </h3>

        {activeTasks.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-xs text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto" />
            <p>No active pending collection tasks assigned right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTasks.map((t) => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
                
                {t.priority === 'CRITICAL' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 animate-pulse" />
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-extrabold text-base text-emerald-400">{t.bin_code}</span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <p className="text-xs text-slate-300 mt-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{t.address}</span>
                    </p>
                  </div>
                  <StatusBadge status={t.bin_status} fillLevel={t.fill_level} />
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex justify-between text-slate-400 font-mono">
                  <span>Waste Category: <strong className="text-slate-200">{t.waste_type}</strong></span>
                  <span>Task Status: <strong className="text-purple-400">{t.status}</strong></span>
                </div>

                {/* Workflow Buttons */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2">
                  {t.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold text-xs transition shadow-md"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Collection</span>
                    </button>
                  )}

                  {t.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-extrabold text-xs transition shadow-lg animate-pulse"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>Mark Collection Completed (Empty Bin)</span>
                    </button>
                  )}

                  {t.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'ASSIGNED')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700"
                    >
                      Accept Task
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Collection History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>My Completed Collection History ({completedTasks.length})</span>
        </h3>

        {completedTasks.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No completed tasks recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {completedTasks.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-200 mr-2">{t.bin_code}</span>
                  <span className="text-slate-400">{t.address}</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold">Emptied to 0%</span>
                  <span className="block text-[10px] text-slate-500">
                    {t.completion_time ? new Date(t.completion_time).toLocaleTimeString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
