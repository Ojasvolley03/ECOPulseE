import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BarChart3, Boxes, MapPinned, ShieldCheck, Trash2, Truck } from 'lucide-react';

const adminAreas = [
  { label: 'Operations dashboard', detail: 'Live city-wide collection overview', icon: BarChart3 },
  { label: 'Bin management', detail: 'Smart bins, status and QR codes', icon: Boxes },
  { label: 'Fleet and routes', detail: 'Vehicles, workers and dispatch', icon: Truck },
];

export default function AdminDepartmentPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#071412] text-slate-100 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(45,212,191,0.13),transparent_32%),radial-gradient(circle_at_85%_85%,rgba(16,185,129,0.08),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" aria-label="Back to EcoPulse front page">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300 text-[#071412] shadow-[0_0_30px_rgba(110,231,183,0.25)]">
              <Trash2 className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-white">EcoPulse</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200/60">Admin department</p>
            </div>
          </Link>
          <Link to="/" className="hidden items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-white sm:flex">
            <ArrowLeft className="h-4 w-4" />
            All departments
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16">
          <div className="max-w-2xl">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/20">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300/80">Admin department</p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">Run a cleaner city from one place.</h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
              See the live operation, coordinate collection resources and respond to waste activity across the network.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {adminAreas.map(({ label, detail, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-sm">
                <Icon className="h-5 w-5 text-emerald-300" />
                <h2 className="mt-6 text-base font-extrabold text-white">{label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
              </div>
            ))}
          </div>

          <Link to="/dashboard" className="mt-10 inline-flex w-fit items-center gap-3 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-extrabold text-[#071412] transition hover:bg-emerald-200">
            Open Admin Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <footer className="border-t border-white/10 pt-5 text-[11px] font-medium text-slate-500">EcoPulse operations control center</footer>
      </div>
    </main>
  );
}
