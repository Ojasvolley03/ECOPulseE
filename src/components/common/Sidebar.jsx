import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Trash2, 
  AlertCircle, 
  ClipboardList, 
  BarChart3, 
  MapPin, 
  PlusCircle, 
  CheckCircle2,
  Truck,
  QrCode,
  Route
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  const allNavLinks = [
    { to: '/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, badge: null },
    { to: '/collections', label: 'Worker & Smart Route', icon: Truck, badge: '75% Alert' },
    { to: '/bins', label: 'Waste Bins & QR Codes', icon: QrCode, badge: null },
    { to: '/citizen', label: 'Citizen Portal & Map', icon: MapPin, badge: null },
    { to: '/report', label: 'File Citizen Complaint', icon: PlusCircle, badge: 'Public' },
    { to: '/complaints', label: 'Complaints Manager', icon: AlertCircle, badge: null },
    { to: '/tasks', label: 'Collection Dispatch', icon: ClipboardList, badge: null },
    { to: '/analytics', label: 'Analytics & AI', icon: BarChart3, badge: null },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <div className="px-3 flex items-center justify-between mb-3">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Smart Waste Portals
            </p>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              Live Data
            </span>
          </div>

          <nav className="space-y-1">
            {allNavLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="truncate">{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer info card */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center space-x-1.5 text-slate-200 font-bold">
          <Route className="w-3.5 h-3.5 text-emerald-400" />
          <span>Smart Route Alert</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Automated collection alerts trigger when any dustbin reaches <strong>75%+ capacity</strong>.
        </p>
      </div>
    </aside>
  );
}
