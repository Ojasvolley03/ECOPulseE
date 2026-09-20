import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, HardHat, Leaf, Recycle, ShieldCheck, Truck } from 'lucide-react';

const departments = [
  {
    label: 'Admin',
    description: 'Monitor the city-wide operation, assets and live performance.',
    to: '/admin-department',
    icon: ShieldCheck,
    accent: 'emerald',
  },
  {
    label: 'Worker',
    description: 'Manage collection routes, assignments and daily field work.',
    to: '/collections',
    icon: Truck,
    accent: 'sky',
  },
  {
    label: 'Citizen',
    description: 'Report issues, explore smart bins and stay connected to your area.',
    to: '/citizen',
    icon: HardHat,
    accent: 'amber',
  },
];

const accentStyles = {
  emerald: {
    icon: 'bg-emerald-400/15 text-emerald-300 ring-emerald-300/20',
    hover: 'hover:border-emerald-300/50 hover:bg-emerald-300/[0.07]',
    arrow: 'text-emerald-300',
  },
  sky: {
    icon: 'bg-sky-400/15 text-sky-300 ring-sky-300/20',
    hover: 'hover:border-sky-300/50 hover:bg-sky-300/[0.07]',
    arrow: 'text-sky-300',
  },
  amber: {
    icon: 'bg-amber-300/15 text-amber-200 ring-amber-300/20',
    hover: 'hover:border-amber-300/50 hover:bg-amber-300/[0.07]',
    arrow: 'text-amber-200',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#071412] text-slate-100 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.12),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(56,189,248,0.10),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300 text-[#071412] shadow-[0_0_30px_rgba(110,231,183,0.25)]">
              <Recycle className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-white">Eco Plus</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200/60">Smart waste network</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex">
            <Leaf className="h-4 w-4 text-emerald-300" />
            Cleaner cities, together
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16 sm:py-20">
          <div className="max-w-2xl animate-[fade-in-up_700ms_ease-out_both]">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-emerald-300/80">Welcome to Eco Plus</p>
            <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
              One network. <span className="text-emerald-300">Every action</span> matters.
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
              Choose your department to enter the live waste-management workspace built for a cleaner, more responsive city.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {departments.map(({ label, description, to, icon: Icon, accent }, index) => {
              const styles = accentStyles[accent];
              return (
                <Link
                  key={label}
                  to={to}
                  className={`group animate-[fade-in-up_700ms_ease-out_both] rounded-2xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1 ${styles.hover}`}
                  style={{ animationDelay: `${150 + index * 100}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${styles.icon}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className={`h-5 w-5 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 ${styles.arrow}`} />
                  </div>
                  <h2 className="mt-8 text-xl font-extrabold text-white">{label}</h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{description}</p>
                  <span className="mt-6 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Enter department</span>
                </Link>
              );
            })}
          </div>
        </section>

        <footer className="flex items-center gap-2 border-t border-white/10 pt-5 text-[11px] font-medium text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
          Live urban operations platform
        </footer>
      </div>
    </main>
  );
}
