import React, { useState, useEffect } from 'react';
import Modal from '../components/common/Modal';
import { PriorityBadge, TaskStatusBadge, StatusBadge } from '../components/common/Badge';
import { api } from '../services/api';
import { ClipboardList, UserCheck, MapPin, Plus, CheckCircle2, Clock, Users } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [bins, setBins] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New task form state
  const [selectedBinId, setSelectedBinId] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [taskPriority, setTaskPriority] = useState('HIGH');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, workersRes, binsRes] = await Promise.all([
        api.getTasks(),
        api.getWorkers(),
        api.getBins()
      ]);

      if (tasksRes.success) setTasks(tasksRes.data);
      if (workersRes.success) setWorkers(workersRes.data);
      if (binsRes.success) setBins(binsRes.data);
    } catch (err) {
      console.error('Error loading task page data:', err);
    }
  };

  const handleOpenAssignModal = (task) => {
    setSelectedTask(task);
    setSelectedWorkerId(task.worker_id ? task.worker_id.toString() : '');
    setIsAssignModalOpen(true);
  };

  const handleAssignWorker = async (e) => {
    e.preventDefault();
    if (!selectedTask || !selectedWorkerId) return;

    try {
      await api.assignTask(selectedTask.id, parseInt(selectedWorkerId));
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error assigning worker:', err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedBinId) return;

    try {
      await api.createTask({
        bin_id: parseInt(selectedBinId),
        worker_id: selectedWorkerId ? parseInt(selectedWorkerId) : null,
        priority: taskPriority
      });
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center space-x-2">
            <ClipboardList className="w-6 h-6 text-emerald-400" />
            <span>Collection Task Dispatch Control</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch workers to critical & filled dustbins across city zones.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-500 hover:to-teal-400 transition shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Dispatch New Task</span>
        </button>
      </div>

      {/* Task Queue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((t) => (
          <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden">
            
            {t.priority === 'CRITICAL' && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 animate-pulse" />
            )}

            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-extrabold text-base text-emerald-400">{t.bin_code}</span>
                <p className="text-xs text-slate-300 mt-0.5 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{t.address}</span>
                </p>
              </div>
              <PriorityBadge priority={t.priority} />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Fill Status:</span>
                <StatusBadge status={t.bin_status} fillLevel={t.fill_level} />
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Assigned Driver:</span>
                <span className="text-slate-200 font-bold">{t.worker_name || 'Unassigned'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <TaskStatusBadge status={t.status} />

              {t.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleOpenAssignModal(t)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600/30 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{t.worker_id ? 'Reassign Driver' : 'Assign Driver'}</span>
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Assign Worker Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Driver to Task">
        <form onSubmit={handleAssignWorker} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Available Collection Worker
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {workers.map((w) => (
                <label
                  key={w.id}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    selectedWorkerId === w.id.toString()
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="worker"
                      value={w.id}
                      checked={selectedWorkerId === w.id.toString()}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                      className="accent-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-xs text-slate-200">{w.name}</p>
                      <p className="text-[11px] text-slate-500">{w.email} | {w.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {w.active_tasks_count} active tasks
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedWorkerId}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition shadow-lg disabled:opacity-50"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Dispatch New Task Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Manually Dispatch Collection Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Target Waste Bin *</label>
            <select
              required
              value={selectedBinId}
              onChange={(e) => setSelectedBinId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="">Select Target Dustbin</option>
              {bins.map(bin => (
                <option key={bin.id} value={bin.id}>
                  {bin.bin_code} — {bin.address} ({bin.fill_level}% fill)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assign Driver (Optional)</label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="">Unassigned (Open Queue)</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.active_tasks_count} active tasks)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dispatch Priority</label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition shadow-lg"
            >
              Dispatch Task
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
