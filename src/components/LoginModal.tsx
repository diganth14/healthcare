import React, { useState } from 'react';
import { Stethoscope, Lock, User as UserIcon, Sparkles, AlertCircle, ArrowRight, Activity, Shield } from 'lucide-react';
import { api } from '../api';
import { User } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login(username.trim(), password.trim());
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-fade-in">
      <div className="glass-card rounded-4xl max-w-md w-full p-8 border border-white/90 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-sky-400/20 filter blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-mint/20 filter blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-sky-500 via-sky-400 to-mint flex items-center justify-center text-white shadow-lg shadow-sky-500/25 mb-3">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Clinic Patient-Flow
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Sign in to access your consulting room or triage portal
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-coral/10 border border-coral/30 flex items-start gap-2.5 text-xs text-coral font-bold animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. dr.smith or nurse.mary"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-slate-200 text-sm font-semibold text-slate-800 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-slate-200 text-sm font-semibold text-slate-800 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl font-black text-sm tracking-wide text-white bg-gradient-to-r from-sky-500 via-sky-600 to-mint shadow-md shadow-sky-500/25 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-slate-200/80">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              One-Click Demo Staff Accounts:
            </span>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => fillDemo('dr.smith', 'doctor123')}
              className="w-full p-2.5 rounded-xl bg-white/70 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 text-left transition-all flex items-center justify-between group text-xs"
            >
              <div>
                <span className="font-extrabold text-slate-800 group-hover:text-sky-700">
                  👨‍⚕️ Dr. Arjun Smith
                </span>
                <span className="text-[10px] text-slate-400 ml-2 font-mono">(dr.smith)</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-sky-100 text-sky-800">
                Doctor
              </span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('nurse.mary', 'nurse123')}
              className="w-full p-2.5 rounded-xl bg-white/70 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-left transition-all flex items-center justify-between group text-xs"
            >
              <div>
                <span className="font-extrabold text-slate-800 group-hover:text-emerald-700">
                  👩‍⚕️ Nurse Mary D'Souza
                </span>
                <span className="text-[10px] text-slate-400 ml-2 font-mono">(nurse.mary)</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                Nurse
              </span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('nurse.sarah', 'nurse123')}
              className="w-full p-2.5 rounded-xl bg-white/70 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-left transition-all flex items-center justify-between group text-xs"
            >
              <div>
                <span className="font-extrabold text-slate-800 group-hover:text-emerald-700">
                  👩‍⚕️ Nurse Sarah Khan
                </span>
                <span className="text-[10px] text-slate-400 ml-2 font-mono">(nurse.sarah)</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                Nurse
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
