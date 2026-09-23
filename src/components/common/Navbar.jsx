import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Trash2, Cpu, LogOut, Radio } from 'lucide-react';

export default function Navbar({ onOpenSimulator }) {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

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
              ) : null}
            </div>
          </div>

        </div>
      </div>

    </header>
  );
}
