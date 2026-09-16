import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/common/StatCard';
import WasteMap from '../components/map/WasteMap';
import SensorSimulatorModal from '../components/simulator/SensorSimulatorModal';
import PredictionWidget from '../components/ai/PredictionWidget';
import { StatusBadge, PriorityBadge, TaskStatusBadge } from '../components/common/Badge';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  FileText, 
  TrendingUp, 
  RefreshCw, 
  Cpu, 
  Flame, 
  Plus, 
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function AdminDashboard({ onOpenSimulator }) {
  const [stats, setStats] = useState(null);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBin, setSelectedBin] = useState(null);

  const { socket } = useSocket();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleBinUpdate = () => {
      fetchDashboardData();
    };

    const handleTaskUpdate = () => {
      fetchDashboardData();
    };

    const handleComplaintUpdate = () => {
      fetchDashboardData();
    };

    socket.on('bin_updated', handleBinUpdate);
    socket.on('critical_alert', handleBinUpdate);
    socket.on('task_created', handleTaskUpdate);
    socket.on('task_status_changed', handleTaskUpdate);
    socket.on('complaint_created', handleComplaintUpdate);

    return () => {
      socket.off('bin_updated', handleBinUpdate);
      socket.off('critical_alert', handleBinUpdate);
      socket.off('task_created', handleTaskUpdate);
      socket.off('task_status_changed', handleTaskUpdate);
      socket.off('complaint_created', handleComplaintUpdate);
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, binsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getBins()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (binsRes.success) setBins(binsRes.data);
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Initializing Live Telemetry Grid...</p>
        </div>
      </div>
    );
  }

  // Pie chart data for bin status breakdown
  const pieData = [
    { name: 'Normal (0-50%)', value: stats.bins.normal, color: '#22c55e' },
    { name: 'Medium (51-75%)', value: stats.bins.medium, color: '#f59e0b' },
    { name: 'Nearly Full (76-90%)', value: stats.bins.nearlyFull, color: '#f97316' },
    { name: 'Critical (91-100%)', value: stats.bins.critical, color: '#f43f5e' },
  ];

  // Bar chart data for waste category averages
  const barData = (stats.wasteTypeBreakdown || []).map(w => ({
    type: w.waste_type,
    count: w.count,
    avgFill: Math.round(w.avg_fill || 0)
  }));

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Title & Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center space-x-2">
            <span>Live Waste Operations Monitor</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 animate-pulse">
              REAL-TIME SYNC
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous sensor tracking, overflow prediction & automated worker dispatches.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSimulator}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-500 hover:to-teal-400 transition shadow-lg"
          >
            <Cpu className="w-4 h-4" />
            <span>Launch Sensor Simulator</span>
          </button>
        </div>
      </div>

      {/* 16 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <StatCard
          title="Total Bins Monitored"
          value={stats.bins.total}
          icon={Trash2}
          color="emerald"
          subtitle={`Avg Fill Level: ${stats.bins.averageFill}%`}
        />

        <StatCard
          title="Critical Overflow Bins"
          value={stats.bins.critical}
          icon={Flame}
          color="rose"
          subtitle={`${stats.bins.nearlyFull} Nearly Full Bins`}
          badge={
            <span className="text-rose-400 font-bold text-[11px] flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Requires Immediate Collection</span>
            </span>
          }
        />

        <StatCard
          title="Pending Collection Tasks"
          value={stats.tasks.pending}
          icon={Clock}
          color="amber"
          subtitle={`${stats.tasks.completed} Tasks Completed`}
        />

        <StatCard
          title="Active Collection Workers"
          value={stats.workers.active}
          icon={Users}
          color="blue"
          subtitle={`${stats.complaints.pending} Pending Complaints`}
        />

      </div>

      {/* Second Metrics Row: Status Breakdown Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase">Normal Bins</p>
            <p className="text-xl font-bold font-mono text-slate-100">{stats.bins.normal}</p>
          </div>
          <span className="text-xs text-emerald-400 font-bold">0-50%</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase">Medium Bins</p>
            <p className="text-xl font-bold font-mono text-slate-100">{stats.bins.medium}</p>
          </div>
          <span className="text-xs text-amber-400 font-bold">51-75%</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div>
            <p className="text-[10px] font-bold text-orange-400 uppercase">Nearly Full</p>
            <p className="text-xl font-bold font-mono text-slate-100">{stats.bins.nearlyFull}</p>
          </div>
          <span className="text-xs text-orange-400 font-bold">76-90%</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 animate-pulse">
          <div>
            <p className="text-[10px] font-bold text-rose-400 uppercase">Critical Bins</p>
            <p className="text-xl font-bold font-mono text-rose-300">{stats.bins.critical}</p>
          </div>
          <span className="text-xs text-rose-400 font-bold">91-100%</span>
        </div>
      </div>

      {/* Main Grid: Interactive Leaflet Map & Critical Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Bin Location Map (Spans 2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-emerald-400" />
              <span>Live Smart Dustbin Locations Map</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Click marker for telemetry details</span>
          </div>

          <WasteMap bins={bins} onSelectBin={setSelectedBin} height="h-[480px]" />
        </div>

        {/* Real-Time Critical Alerts & AI Predictor (1 col) */}
        <div className="space-y-6">
          
          {/* Critical Bins Alerts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
                <span>Real-Time Critical Bins ({stats.recentCriticalBins.length})</span>
              </h4>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded border border-rose-500/40 uppercase">
                High Priority
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {stats.recentCriticalBins.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 text-center">No critical bins detected.</p>
              ) : (
                stats.recentCriticalBins.map((bin) => (
                  <div
                    key={bin.id}
                    className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-rose-300">{bin.bin_code}</span>
                      <p className="text-slate-400 text-[11px] truncate max-w-[180px]">{bin.address}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-sm text-rose-400">{bin.fill_level}%</span>
                      <span className="block text-[10px] text-rose-300/80 uppercase">CRITICAL</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Waste Overflow Prediction Widget */}
          <PredictionWidget />

        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fill Level Distribution (Pie Chart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Bin Fill-Level Distribution</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste Category Statistics (Bar Chart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <BarChart className="w-5 h-5 text-teal-400" />
            <span>Waste Type Average Fill Levels</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="type" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                />
                <Bar dataKey="avgFill" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Avg Fill (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Operations Tables: Recent Complaints & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Complaints */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Recent Citizen Complaints</span>
            </h3>
            <Link to="/complaints" className="text-xs text-emerald-400 font-bold hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recentComplaints.map(c => (
              <div key={c.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">{c.citizen_name}</span>
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-1">{c.description}</p>
                  <p className="text-slate-500 text-[10px]">{c.location_address}</p>
                </div>
                <TaskStatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Collection Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Recent Dispatch Tasks</span>
            </h3>
            <Link to="/tasks" className="text-xs text-emerald-400 font-bold hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recentTasks.map(t => (
              <div key={t.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-400">{t.bin_code}</span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <p className="text-slate-400 text-[11px]">Worker: {t.worker_name || 'Unassigned'}</p>
                </div>
                <TaskStatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
