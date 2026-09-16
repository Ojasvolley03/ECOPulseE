import React from 'react';

export function StatusBadge({ status, fillLevel }) {
  let color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let label = status || 'NORMAL';

  switch (status) {
    case 'NORMAL':
      color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      break;
    case 'MEDIUM':
      color = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      break;
    case 'NEARLY_FULL':
      color = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      break;
    case 'CRITICAL':
      color = 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse';
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {fillLevel !== undefined && <span className="mr-1 font-mono font-bold">{fillLevel}%</span>}
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  let color = 'bg-slate-800 text-slate-300 border-slate-700';

  switch (priority) {
    case 'LOW':
      color = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      break;
    case 'MEDIUM':
      color = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      break;
    case 'HIGH':
      color = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      break;
    case 'CRITICAL':
      color = 'bg-rose-500/20 text-rose-400 border-rose-500/50 font-bold';
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      {priority}
    </span>
  );
}

export function TaskStatusBadge({ status }) {
  let color = 'bg-slate-800 text-slate-300';
  let label = status;

  switch (status) {
    case 'PENDING':
      color = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      break;
    case 'ASSIGNED':
      color = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      break;
    case 'IN_PROGRESS':
      color = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      break;
    case 'COMPLETED':
      color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>
      {label}
    </span>
  );
}
