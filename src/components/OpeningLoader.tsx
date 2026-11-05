import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Progress steps are uneven on purpose, so the bar feels like real work rather than a timer
const PROGRESS_DELAYS = [250, 250, 100, 250, 250, 100, 300, 250, 250, 500];

// How long the opening screen stays before it slides away
const OPEN_AFTER_MS = 3000;

const cardMotion = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: {
    duration: 1,
    delay: 0.5,
    bounce: 0.4,
    type: 'spring' as const,
  },
};

const CardHeader: React.FC<{ title: string }> = ({ title }) => (
  <>
    <div className="flex items-center justify-between gap-6 px-3 py-2">
      <p className="text-sm font-medium uppercase tracking-wide text-ink/70">{title}</p>
      <div className="flex items-center justify-center gap-1">
        <div className="size-3 rounded-full bg-chalk" />
        <div className="size-3 rounded-full bg-chalk" />
      </div>
    </div>
    <hr className="border-ink/10" />
  </>
);

/**
 * The clinic "opening" card: ten token squares fill as the day starts, while three
 * draggable notes about how the queue works drop onto the desk.
 */
function OpeningCard() {
  const [progress, setProgress] = useState(0);
  const [showDeskNote, setShowDeskNote] = useState(false);
  const [showRuleNote, setShowRuleNote] = useState(false);
  const [showPlaceNote, setShowPlaceNote] = useState(false);

  useEffect(() => {
    if (progress >= 100) return;

    const delay = PROGRESS_DELAYS[Math.floor(progress / 10)];
    const timeout = window.setTimeout(() => {
      setProgress(current => Math.min(current + 10, 100));
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [progress]);

  useEffect(() => {
    if (progress >= 20) setShowDeskNote(true);
    if (progress >= 50) setShowRuleNote(true);
    if (progress >= 70) setShowPlaceNote(true);
  }, [progress]);

  return (
    <div className="relative z-50 flex h-full min-h-screen w-full items-center justify-center overflow-hidden bg-chalk">
      <div className="rounded-2xl bg-white shadow-[0_24px_48px_-32px_rgba(15,31,26,0.35)]">
        <CardHeader title="Opening the clinic" />

        <div className="p-4">
          <div className="flex w-full gap-2 rounded-lg bg-chalk/60 p-2">
            {Array.from({ length: 10 }, (_, index) => (
              <div
                key={index}
                className={`size-7 rounded-md transition-colors duration-300 ${
                  progress >= (index + 1) * 10 ? 'bg-clinic' : 'bg-rule/50'
                }`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-6">
            <p className="text-xs font-medium text-ink-mute">Tokens 1 to 10</p>
            <p className="font-display text-lg font-bold tabular-nums tracking-tight text-ink/80">{progress}%</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeskNote && (
          <motion.div
            {...cardMotion}
            drag
            className="absolute bottom-[10%] right-[10%] cursor-grab overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_-32px_rgba(15,31,26,0.35)] active:cursor-grabbing"
          >
            <CardHeader title="At the desk" />
            <div className="max-w-xs p-4 text-sm font-medium leading-relaxed text-ink/50">
              Vitals first. The app suggests a level from them: emergency, urgent or normal. The nurse has the
              final say.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRuleNote && (
          <motion.div
            {...cardMotion}
            drag
            className="absolute bottom-[10%] left-[10%] rotate-12 cursor-grab overflow-hidden bg-white shadow-[0_24px_48px_-32px_rgba(15,31,26,0.35)] active:cursor-grabbing"
          >
            <div className="max-w-[11rem] p-4 font-mono text-xl font-medium uppercase leading-[1] tracking-tight text-ink/60">
              Emergencies
              <br />
              first,
              <br />
              then urgent,
              <br />
              then by
              <br />
              arrival
              <br />
              <br />
              One queue, two screens
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlaceNote && (
          <motion.div
            {...cardMotion}
            drag
            className="absolute right-[10%] top-[10%] h-40 -rotate-12 cursor-grab overflow-hidden bg-white shadow-[0_24px_48px_-32px_rgba(15,31,26,0.35)] active:cursor-grabbing"
          >
            <div className="p-4 font-mono text-xl font-medium uppercase leading-[1] tracking-tight text-ink/60">
              with{' '}
              <svg aria-hidden="true" viewBox="0 0 24 24" className="inline h-5 w-5 fill-current stroke-0">
                <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6 6 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.51L12 21.35Z" />
              </svg>{' '}
              for
              <br />
              one-doctor
              <br />
              clinics
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface OpeningLoaderProps {
  /** Called the moment the opening screen starts sliding away, so the page beneath can begin its own entrance */
  onDone: () => void;
  /** Called once the slide-away has finished and the loader can be dropped for good */
  onExited?: () => void;
}

/**
 * Full-screen opening: shows the clinic card for three seconds, then slides it up and away.
 * Plays once per page load: the app drops it after onExited and never mounts it again.
 */
export const OpeningLoader: React.FC<OpeningLoaderProps> = ({ onDone, onExited }) => {
  const [isOpening, setIsOpening] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsOpening(false);
      onDone();
    }, OPEN_AFTER_MS);
    return () => window.clearTimeout(timeout);
    // onDone is stable for the life of the app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence onExitComplete={onExited}>
      {isOpening && (
        <motion.div
          key="opening"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 1, ease: [0.785, 0.135, 0.15, 0.86] }}
          className="fixed inset-0 z-[60]"
          aria-label="Opening the clinic"
          role="status"
        >
          <OpeningCard />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
