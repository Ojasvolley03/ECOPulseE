import React, { useState, useEffect } from 'react';
import { PriorityBadge, TaskStatusBadge } from '../components/common/Badge';
import { api } from '../services/api';
import { AlertCircle, CheckCircle2, Clock, Filter, MapPin, User, FileText } from 'lucide-react';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, priorityFilter]);

  const fetchComplaints = async () => {
    let params = '?';
    if (statusFilter) params += `status=${statusFilter}&`;
    if (priorityFilter) params += `priority=${priorityFilter}&`;

    try {
      const res = await api.getComplaints(params);
      if (res.success) setComplaints(res.data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateComplaintStatus(id, { status });
      fetchComplaints();
    } catch (err) {
      console.error('Error updating complaint:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center space-x-2">
            <AlertCircle className="w-6 h-6 text-amber-400" />
            <span>Citizen Complaints & Incident Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review overflow complaints, classify urgency, and update resolution statuses.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">HIGH Priority</option>
            <option value="MEDIUM">MEDIUM Priority</option>
            <option value="LOW">LOW Priority</option>
          </select>
        </div>
      </div>

      {/* Complaints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {complaints.map((c) => (
          <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-200">{c.citizen_name}</span>
                  <PriorityBadge priority={c.priority} />
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{c.location_address}</span>
                </p>
              </div>
              <TaskStatusBadge status={c.status} />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              "{c.description}"
            </p>

            {c.image_url && (
              <img src={c.image_url} alt="Incident" className="h-40 w-full object-cover rounded-xl border border-slate-800" />
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 font-mono">
                Filed: {new Date(c.created_at).toLocaleDateString()}
              </span>

              <div className="flex items-center space-x-2">
                {c.status !== 'IN_PROGRESS' && c.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'IN_PROGRESS')}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold hover:bg-purple-500/20 transition"
                  >
                    Mark In Progress
                  </button>
                )}

                {c.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus(c.id, 'RESOLVED')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold hover:bg-emerald-500/20 transition"
                  >
                    Resolve Complaint
                  </button>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
