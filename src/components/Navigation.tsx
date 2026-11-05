import React, { useEffect, useState } from 'react';
import { Stethoscope, LogOut } from 'lucide-react';
import { User } from '../types';

interface NavigationProps {
  currentUser: User | null;
  onLogout: () => void;
  onSignIn?: () => void;
  /** The header sits over a full-bleed photograph until the page scrolls */
  overHero?: boolean;
  isSocketConnected: boolean;
  activeView: string;
  onChangeView: (view: any) => void;
  waitingCount: number;
  emergencyCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentUser,
  onLogout,
  onSignIn,
  overHero = false,
  isSocketConnected,
}) => {
  // The header picks up a background and shadow once the page has scrolled under it
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const transparent = overHero && !scrolled;

  const headerClass = transparent
    ? 'border-transparent bg-transparent text-white'
    : scrolled
      ? 'border-rule bg-chalk/95 text-ink shadow-[0_8px_24px_-16px_rgba(15,31,26,0.3)] backdrop-blur'
      : 'border-rule bg-chalk/80 text-ink backdrop-blur';

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-[background-color,box-shadow,border-color,color] duration-300 ${headerClass}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-clinic text-white">
            <Stethoscope className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-display truncate text-lg font-bold tracking-tight">MediTrack</span>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-3">
            {/* Realtime connection status */}
            <div
              className="hidden items-center gap-2 text-sm text-ink-soft sm:flex"
              title={isSocketConnected ? 'Connected to the clinic server' : 'Reconnecting to the clinic server'}
            >
              <span
                className={`h-2 w-2 rounded-full ${isSocketConnected ? 'bg-triage-normal' : 'bg-triage-urgent'}`}
                aria-hidden="true"
              />
              {isSocketConnected ? 'Live sync' : 'Reconnecting'}
            </div>

            {/* Signed-in user */}
            <div className="flex items-center gap-2 rounded-full border border-rule bg-white py-1 pl-1 pr-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                  currentUser.role === 'doctor' ? 'bg-clinic' : 'bg-triage-normal'
                }`}
              >
                {currentUser.role === 'doctor' ? 'DR' : 'RN'}
              </span>
              <span className="text-sm leading-tight">
                <span className="font-semibold text-ink">{currentUser.name}</span>{' '}
                <span className="text-ink-mute">{currentUser.role === 'doctor' ? 'Doctor' : 'Nurse'}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              aria-label="Sign out"
              title="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-rule text-ink-soft transition-[color,border-color,transform] duration-150 hover:border-triage-emergency/40 hover:text-triage-emergency active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinic"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <nav className="flex items-center gap-6">
            <a
              href="#how-it-works"
              className={`hidden text-sm font-semibold underline decoration-transparent decoration-2 underline-offset-4 transition-[color,text-decoration-color] duration-200 sm:inline ${
                transparent ? 'text-white/85 hover:text-white hover:decoration-white' : 'text-ink-soft hover:text-ink hover:decoration-clinic'
              }`}
            >
              How it works
            </a>
            {transparent ? (
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/70 px-4 text-sm font-semibold text-white transition-[background-color,color,transform] duration-150 hover:bg-white hover:text-ink active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Sign in
              </button>
            ) : (
              <button type="button" onClick={onSignIn} className="btn-primary h-10 px-4 text-sm">
                Sign in
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
