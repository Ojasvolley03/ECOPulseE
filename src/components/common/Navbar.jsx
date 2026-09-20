import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../services/api';
import { Trash2, Bell, Cpu, LogOut, User, Radio, AlertTriangle } from 'lucide-react';

export default function Navbar({ onOpenSimulator }) {
  const { user, logout } = useAuth();
  const { connected, liveAlerts, dismissAlert } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_status: 1 } : n));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read_status).length;

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <Trash2 className="w-6 h-6 text-slate-950 font-extrabold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-100">EcoPulse</span>
              </div>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Live Socket Status */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 text-xs">
              <Radio className={`w-3.5 h-3.5 ${connected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-slate-300 font-medium">
                {connected ? 'Real-Time Sync' : 'Connecting...'}
              </span>
            </div>

            {/* Sensor Simulator Button */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md transition-all transform hover:scale-[1.02]"
            >
              <Cpu className="w-4 h-4" />
              <span>SENSOR SIMULATOR</span>
            </button>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                  <div className="p-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-200">System Notifications</h4>
                    <span className="text-xs text-slate-400">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-slate-500 text-center">No notifications available.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`p-3 text-xs cursor-pointer transition-colors hover:bg-slate-800/40 ${n.read_status ? 'opacity-60' : 'bg-emerald-500/5'}`}
                        >
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-semibold text-slate-200">{n.title}</p>
                              <p className="text-slate-400 mt-0.5">{n.message}</p>
                              <span className="text-[10px] text-slate-500 mt-1 block">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Portal Switcher & Access Badges */}
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
              <a
                href="/collections"
                className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-[11px] font-bold transition"
              >
                <span>🚚 Worker View</span>
              </a>
              <a
                href="/citizen"
                className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition"
              >
                <span>👤 Citizen View</span>
              </a>

              {user ? (
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <a href="/login" className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition">
                  Login
                </a>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Floating Live Critical Toast Alert Ticker */}
      {liveAlerts.length > 0 && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 px-4 py-2 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
            <span className="font-bold uppercase tracking-wider">Live Critical Alert:</span>
            <span>{liveAlerts[0].message}</span>
          </div>
          <button
            onClick={() => dismissAlert(liveAlerts[0].id)}
            className="text-rose-400 hover:text-rose-200 text-xs font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </header>
  );
}
