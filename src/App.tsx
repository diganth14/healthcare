import React, { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import confetti from 'canvas-confetti';
import { api, getStoredUser, clearStoredAuth } from './api';
import { getSocket, subscribeToQueueEvents } from './socket';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { SignInPage } from './components/SignInPage';
import { OpeningLoader } from './components/OpeningLoader';
import { NursePortal } from './components/NursePortal';
import { DoctorPortal } from './components/DoctorPortal';
import { BioSphere3D } from './components/BioSphere3D';
import { HeartbeatWave } from './components/HeartbeatWave';
import { EmergencyAlertData, QueueResponse, User } from './types';

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

// Page rise: the outgoing page sinks and dims while the incoming page climbs from the
// bottom as a narrow card that widens to full screen (see index.css). The `page-rise`
// class on <html> scopes the animation to transitions started here.
function runPageTransition(update: () => void) {
  const doc = document as ViewTransitionDocument;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const commit = () => {
    flushSync(update);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  };

  if (!doc.startViewTransition || reduced) {
    commit();
    return;
  }

  const root = document.documentElement;
  root.classList.add('page-rise');
  doc.startViewTransition(commit).finished.finally(() => root.classList.remove('page-rise'));
}

export const App: React.FC = () => {
  // Current Authenticated User (Doctor or Nurse)
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Which signed-out page is showing
  const [view, setView] = useState<'landing' | 'signin'>('landing');

  // The opening screen plays once per page load for visitors who are not signed in.
  // The landing page mounts as it slides away (opened), and the loader is dropped for good once
  // the slide has finished (openingFinished), so it never replays on sign in, sign out or back.
  const [opened, setOpened] = useState(() => !!getStoredUser());
  const [openingFinished, setOpeningFinished] = useState(() => !!getStoredUser());

  // Live Clinical Queue State from Backend
  const [queueData, setQueueData] = useState<QueueResponse>({
    inConsultation: null,
    waitingQueue: [],
    counts: {
      totalWaiting: 0,
      emergencyCount: 0,
      urgentCount: 0,
      normalCount: 0,
    },
  });

  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  // Non-intrusive Emergency Alert for Doctor
  const [incomingEmergencyAlert, setIncomingEmergencyAlert] = useState<EmergencyAlertData | null>(null);

  // Fetch Queue from Backend API
  const fetchQueue = useCallback(async () => {
    if (!currentUser) return;
    try {
      setQueueError(null);
      const data = await api.getQueue();
      setQueueData(data);
    } catch (err: any) {
      console.warn('Queue fetch error:', err.message);
      setQueueError(err.message);
    }
  }, [currentUser]);

  // Initial load and auth expiration listener
  useEffect(() => {
    if (currentUser) {
      fetchQueue();
    }

    const handleAuthExpired = () => {
      setCurrentUser(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [currentUser, fetchQueue]);

  // Socket.IO live real-time synchronization
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);

    if (socket.connected) {
      setIsSocketConnected(true);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    const unsubscribe = subscribeToQueueEvents({
      onQueueUpdated: () => {
        console.log('[Realtime] Queue updated event received from server');
        fetchQueue();
      },
      onPatientCalled: (calledVisit) => {
        console.log('[Realtime] Patient called:', calledVisit.patient_name);
        fetchQueue();
      },
      onCaseClosed: () => {
        console.log('[Realtime] Case closed event received');
        fetchQueue();
      },
      onEmergencyAlert: (alert) => {
        console.log('[Realtime 🚨] Emergency patient arrived:', alert);
        setIncomingEmergencyAlert(alert);
        fetchQueue();

        // Audio notification chime via Web Audio API
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.35);
        } catch (e) {
          // Audio context might be blocked if user hasn't interacted yet
        }
      },
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      unsubscribe();
    };
  }, [fetchQueue]);

  // Logout handler
  const handleLogout = () => {
    runPageTransition(() => {
      clearStoredAuth();
      setCurrentUser(null);
      setIncomingEmergencyAlert(null);
      setView('landing');
    });
  };

  // Determine current ambient risk level for 3D sphere and rhythm line
  const highestRiskLevel = queueData.counts.emergencyCount > 0
    ? 'emergency'
    : queueData.counts.urgentCount > 0
    ? 'urgent'
    : 'routine';

  const activeBpm = queueData.inConsultation?.vitals_heart_rate
    || (queueData.waitingQueue[0]?.vitals_heart_rate)
    || 74;

  const openSignIn = () => runPageTransition(() => setView('signin'));
  const backToLanding = () => runPageTransition(() => setView('landing'));
  const handleLoginSuccess = (u: User) => {
    runPageTransition(() => {
      setCurrentUser(u);
      setView('landing');
    });
  };

  // Signed out, on the sign-in page: it carries its own header
  if (!currentUser && view === 'signin') {
    return <SignInPage onLoginSuccess={handleLoginSuccess} onBack={backToLanding} />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col selection:bg-sky-500/20 selection:text-sky-900 ${
        currentUser ? 'justify-between bg-[#F8FAFC]' : 'bg-chalk'
      }`}
    >
      {/* Dynamic Background Spatial Glows (portals only) */}
      {currentUser && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-200/35 filter blur-3xl" />
          <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-mint/20 filter blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-sky-100/40 filter blur-3xl" />
        </div>
      )}

      {/* Main Navigation Header */}
      <Navigation
        currentUser={currentUser}
        onLogout={handleLogout}
        onSignIn={openSignIn}
        overHero={!currentUser}
        isSocketConnected={isSocketConnected}
        activeView={currentUser ? currentUser.role : 'login'}
        onChangeView={() => {}}
        waitingCount={queueData.counts.totalWaiting}
        emergencyCount={queueData.counts.emergencyCount}
      />

      {!openingFinished && (
        <OpeningLoader onDone={() => setOpened(true)} onExited={() => setOpeningFinished(true)} />
      )}

      {!currentUser ? (
        opened ? <LandingPage onSignIn={openSignIn} /> : <div className="min-h-screen" aria-hidden="true" />
      ) : (
        <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Role-Guarded Portals */}
          {currentUser.role === 'nurse' && (
            <NursePortal
              currentUser={currentUser}
              queueData={queueData}
              onRefreshQueue={fetchQueue}
            />
          )}

          {currentUser.role === 'doctor' && (
            <DoctorPortal
              currentUser={currentUser}
              queueData={queueData}
              onRefreshQueue={fetchQueue}
              incomingEmergencyAlert={incomingEmergencyAlert}
              onDismissEmergencyAlert={() => setIncomingEmergencyAlert(null)}
            />
          )}
        </main>
      )}

      {/* Minimal Flowing Heartbeat Line across the bottom (portals only) */}
      {currentUser && <HeartbeatWave riskLevel={highestRiskLevel as any} bpm={activeBpm} />}
    </div>
  );
};
