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
  CheckCircle2 
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || 'CITIZEN';

  const adminLinks = [
    { to: '/waste-management', label: 'Monitoring Dashboard', icon: LayoutDashboard },
    { to: '/waste-management/bins', label: 'Waste Bins', icon: Trash2 },
    { to: '/waste-management/complaints', label: 'Complaints Manager', icon: AlertCircle },
    { to: '/waste-management/tasks', label: 'Collection Tasks', icon: ClipboardList },
    { to: '/waste-management/analytics', label: 'Analytics & AI', icon: BarChart3 },
  ];

  const workerLinks = [
    { to: '/waste-management/collections', label: 'My Assigned Tasks', icon: ClipboardList },
    { to: '/waste-management/history', label: 'Completed History', icon: CheckCircle2 },
  ];

  const citizenLinks = [
    { to: '/waste-management/citizen', label: 'Nearby Waste Bins', icon: MapPin },
    { to: '/waste-management/report', label: 'Report Waste Problem', icon: PlusCircle },
    { to: '/waste-management/my-complaints', label: 'My Complaints', icon: AlertCircle },
  ];

  let links = citizenLinks;
  if (role === 'ADMIN') links = adminLinks;
  if (role === 'WORKER') links = workerLinks;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
            {role} PORTAL
          </p>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer info card */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">Environmental Alert</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Automated collection dispatches trigger at 91%+ CRITICAL fill.
        </p>
      </div>
    </aside>
  );
}
