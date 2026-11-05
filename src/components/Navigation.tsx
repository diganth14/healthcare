import React from 'react';
import { 
  Stethoscope, 
  Users, 
  Wifi, 
  Sparkles, 
  LogOut, 
  UserCheck, 
  ShieldCheck, 
  UserPlus, 
  FileText 
} from 'lucide-react';
import { User } from '../types';

interface NavigationProps {
  currentUser: User | null;
  onLogout: () => void;
  isSocketConnected: boolean;
  activeView: string;
  onChangeView: (view: any) => void;
  waitingCount: number;
  emergencyCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentUser,
  onLogout,
  isSocketConnected,
  activeView,
  onChangeView,
  waitingCount,
  emergencyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-white/75 border-b border-white/80 shadow-[0_4px_24px_rgba(15,23,42,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-3.5 gap-4">
          {/* Brand & Clinic Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-sky-400 to-mint flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-sky-700 bg-clip-text text-transparent">
                  AuraHealth Clinic Flow
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  Patient-Flow v2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Single-Doctor & Nurse Community Clinic System
              </p>
            </div>
          </div>

          {/* Right Area: User badge, Socket Live Pill, Logout */}
          <div className="flex items-center gap-3">
            {/* Live Real-time Socket Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200/80 text-slate-600">
              <span className="relative flex h-2 w-2">
                {isSocketConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isSocketConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </span>
              <span className="text-[11px] font-bold">
                {isSocketConnected ? 'Live Socket Sync' : 'Reconnecting...'}
              </span>
            </div>

            {/* Current Logged In User */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 bg-white/90 p-1.5 pr-3 rounded-full border border-slate-200 shadow-xs">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${
                    currentUser.role === 'doctor' ? 'bg-sky-600' : 'bg-emerald-600'
                  }`}>
                    {currentUser.role === 'doctor' ? 'DR' : 'RN'}
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block leading-tight">
                      {currentUser.name}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider block leading-none ${
                      currentUser.role === 'doctor' ? 'text-sky-600' : 'text-emerald-600'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-coral hover:bg-coral/10 border border-slate-200 hover:border-coral/20 transition-all"
                  title="Sign out of portal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
