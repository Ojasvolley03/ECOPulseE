import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LockKeyhole, Mail, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      const destination = result.user.role === 'WORKER'
        ? '/collections'
        : result.user.role === 'CITIZEN'
          ? '/citizen'
          : '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-slate-100">
      <div className="mx-auto flex min-h-[75vh] w-full max-w-md flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-xl shadow-emerald-950">
            <Trash2 className="h-9 w-9 text-slate-950" />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Sign in to EcoPulse</h1>
          <p className="mt-2 text-sm text-slate-400">Use your assigned account to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Email
            <span className="relative mt-2 block">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-sm text-slate-100 outline-none focus:border-emerald-500" />
            </span>
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Password
            <span className="relative mt-2 block">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-sm text-slate-100 outline-none focus:border-emerald-500" />
            </span>
          </label>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50">
            <LogIn className="h-4 w-4" />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}