import React, { useEffect, useRef } from 'react';
import { startSmoothScroll } from '../smoothScroll';
import { useReveal } from '../useReveal';

interface LandingPageProps {
  onSignIn: () => void;
}

type Level = 'emergency' | 'urgent' | 'normal';

const LEVEL_LABEL: Record<Level, string> = {
  emergency: 'Emergency',
  urgent: 'Urgent',
  normal: 'Normal',
};

const LEVEL_TEXT: Record<Level, string> = {
  emergency: 'text-triage-emergency',
  urgent: 'text-triage-urgent',
  normal: 'text-triage-normal',
};

const LEVEL_SWATCH: Record<Level, string> = {
  emergency: 'bg-triage-emergency',
  urgent: 'bg-triage-urgent',
  normal: 'bg-triage-normal',
};

// Static example used only for the board illustration. The urgent case (token 17)
// has moved ahead of the routine ones, which wait in order of arrival.
const WAITING: { token: number; name: string; meta: string; level: Level; minutes: number }[] = [
  { token: 17, name: 'Lakshmi Bai', meta: '26 F', level: 'urgent', minutes: 12 },
  { token: 12, name: 'Basavaraj Patil', meta: '34 M', level: 'normal', minutes: 31 },
  { token: 13, name: 'Anita Rao', meta: '41 F', level: 'normal', minutes: 24 },
  { token: 16, name: 'Mohan Gowda', meta: '67 M', level: 'normal', minutes: 8 },
];

const LEVELS: { level: Level; triggers: string; effect: string }[] = [
  {
    level: 'emergency',
    triggers:
      'Oxygen below 90%. Pulse above 130 or below 45. Temperature 39.5°C or more. Blood pressure 180/115 or higher. Chest pain with breathlessness, or chest pain over age 50. Pain 9 or more out of 10.',
    effect: 'Front of the queue. The doctor gets an alert on their screen.',
  },
  {
    level: 'urgent',
    triggers:
      'Oxygen 90 to 94%. Pulse 105 to 130. Temperature 38.3 to 39.4°C. Blood pressure 140/90 or higher. Breathlessness, high fever or severe headache. Pregnancy with fever or raised pressure. Pain 6 to 8.',
    effect: 'Ahead of routine cases, in order of arrival.',
  },
  {
    level: 'normal',
    triggers: 'Everything else.',
    effect: 'Routine queue, in order of arrival.',
  },
];

// Photography (Unsplash License, free to use)
const HERO_PHOTO = {
  src: 'https://images.unsplash.com/photo-1659718282278-fd3ba02cb782?auto=format&fit=crop&w=2400&h=1400&crop=faces&q=78',
  alt: 'A doctor examines a patient at a village health outreach clinic',
  credit: 'Photo Mufid Majnun, Unsplash',
};

const PHOTOS = {
  desk: {
    src: 'https://images.unsplash.com/photo-1631815590058-860e4f83c1e8?auto=format&fit=crop&w=1400&q=75',
    alt: "A healthcare worker in blue scrubs checks a woman's blood pressure at a clinic",
    caption: 'Vitals are taken at the desk before a patient joins the queue.',
    credit: 'CDC on Unsplash',
  },
  room: {
    src: 'https://images.unsplash.com/photo-1631558554184-319c88f4f8a4?auto=format&fit=crop&w=1000&q=75',
    alt: 'A doctor listens to a patient’s chest with a stethoscope',
    caption: 'The doctor opens each visit with the patient’s past records already on screen.',
    credit: 'National Cancer Institute on Unsplash',
  },
};

const HERO_LINES = ['Emergencies first.', 'Then urgent.', 'Then in order of arrival.'];

const LevelTag: React.FC<{ level: Level }> = ({ level }) => (
  <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${LEVEL_TEXT[level]}`}>
    <span className={`h-2.5 w-2.5 rounded-sm ${LEVEL_SWATCH[level]}`} aria-hidden="true" />
    {LEVEL_LABEL[level]}
  </span>
);

// A masked line: the text rises into view from below its own box
const Mask: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => (
  <span className="hero__mask">
    <span style={{ animationDelay: `${delay}ms` }}>{children}</span>
  </span>
);

const rowDelay = (index: number): React.CSSProperties => ({ animationDelay: `${index * 70}ms` });
const revealDelay = (ms: number): React.CSSProperties => ({ transitionDelay: `${ms}ms` });

const QueueBoard: React.FC = () => (
  <figure className="w-full">
    <div className="overflow-hidden rounded-xl border border-rule bg-white shadow-[0_1px_2px_rgba(15,31,26,0.05),0_28px_56px_-32px_rgba(15,31,26,0.28)]">
      <div className="board-row px-5 pb-5 pt-5 sm:px-6" style={rowDelay(0)}>
        <p className="text-sm font-semibold text-ink-soft">With the doctor</p>
        <div className="mt-2 flex items-start gap-4">
          <span className="font-display text-5xl font-extrabold leading-none tabular-nums text-ink">14</span>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-lg font-semibold leading-tight text-ink">
              Devappa Nayak <span className="font-normal text-ink-mute">58 M</span>
            </p>
            <p className="mt-0.5 text-sm text-ink-soft">Chest pain, breathless</p>
          </div>
          <div className="shrink-0 pt-1 text-right">
            <LevelTag level="emergency" />
            <p className="mt-0.5 text-sm text-ink-mute">In room 2 min</p>
          </div>
        </div>
      </div>

      <div className="board-row flex items-baseline justify-between border-t border-rule px-5 py-3 sm:px-6" style={rowDelay(1)}>
        <p className="text-sm font-semibold text-ink-soft">Waiting</p>
        <p className="text-sm text-ink-mute">4 patients</p>
      </div>

      <ol>
        {WAITING.map((v, i) => (
          <li
            key={v.token}
            className="board-row flex items-center gap-4 border-t border-rule px-5 py-3 transition-colors duration-200 hover:bg-chalk/70 sm:px-6"
            style={rowDelay(i + 2)}
          >
            <span className="font-display w-9 text-2xl font-bold tabular-nums text-ink">{v.token}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold leading-tight text-ink">
                {v.name} <span className="font-normal text-ink-mute">{v.meta}</span>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <LevelTag level={v.level} />
              <p className="mt-0.5 text-sm text-ink-mute">Waiting {v.minutes} min</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
    <figcaption className="mt-3 max-w-[52ch] text-sm leading-relaxed text-ink-mute">
      An example afternoon. Token numbers are given at the desk. The urgent case has moved ahead of the routine ones.
    </figcaption>
  </figure>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);

  // Smooth scrolling for the landing page only; torn down when the portal mounts
  useEffect(() => startSmoothScroll(), []);

  // Reveal sections once as they scroll into view
  useReveal(rootRef);

  // Hero motion. The photograph drifts up slightly while the hero is on screen. Then, as the
  // next section scrolls over it, the whole hero sinks and softens behind it: a parallax seam.
  // Blur moves in half-pixel steps to limit repaints.
  useEffect(() => {
    const img = posterRef.current;
    const hero = img?.closest('section');
    const next = hero?.nextElementSibling as HTMLElement | null;
    if (!img || !hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let lastBlur = -1;
    const update = () => {
      const { top, height } = hero.getBoundingClientRect();
      const progress = height > 0 ? Math.min(1, Math.max(0, -top / height)) : 0;
      img.style.transform = `translate3d(0, ${progress * -8}%, 0)`;

      if (next) {
        const vh = window.innerHeight;
        const seam = Math.min(1, Math.max(0, (vh - next.getBoundingClientRect().top) / vh));
        hero.style.transform = seam > 0 ? `translate3d(0, ${Math.round(seam * vh * 0.45)}px, 0)` : '';
        const blur = Math.round(seam * 8 * 2) / 2;
        if (blur !== lastBlur) {
          lastBlur = blur;
          hero.style.filter = blur > 0 ? `blur(${blur}px)` : '';
        }
        hero.style.willChange = seam > 0 && seam < 1 ? 'transform, filter' : '';
      }
      frame = window.requestAnimationFrame(update);
    };
    update();
    return () => {
      window.cancelAnimationFrame(frame);
      hero.style.transform = '';
      hero.style.filter = '';
      hero.style.willChange = '';
    };
  }, []);

  return (
    <div ref={rootRef} className="bg-chalk text-ink">
      {/* Hero: full-screen photograph, headline rising line by line */}
      <section className="hero -mt-16">
        <img ref={posterRef} className="hero__poster" src={HERO_PHOTO.src} alt={HERO_PHOTO.alt} decoding="async" />

        <div className="hero__content">
          <p className="hero__kicker">
            <Mask delay={650}>For one-doctor community clinics</Mask>
          </p>
          <h1 className="hero__title">
            {HERO_LINES.map((line, i) => (
              <Mask key={line} delay={760 + i * 90}>
                {line}
              </Mask>
            ))}
          </h1>
          <p className="hero__description">
            <Mask delay={1100}>
              MediTrack runs the waiting room of a one-doctor clinic. The nurse records vitals at
              the desk, the queue sorts itself, and the doctor calls the next name.
            </Mask>
          </p>
          <div className="hero__actions">
            <button type="button" className="text-link text-link--light" onClick={onSignIn}>
              Sign in<span aria-hidden="true">↗</span>
            </button>
            <a className="text-link text-link--light" href="#how-it-works">
              See how it works<span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="hero__bottom" aria-hidden="true">
          <span>Scroll to explore</span>
          <span className="hero__line" />
          <span>{HERO_PHOTO.credit}</span>
        </div>
      </section>

      {/* Everything below slides over the hero as it sinks away */}
      <div className="relative z-10 bg-chalk">

      {/* The queue board */}
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8 lg:py-24">
          <div className="lg:col-span-5" data-reveal>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              The board the nurse and the doctor share.
            </h2>
            <p className="mt-5 max-w-[46ch] leading-relaxed text-ink-soft">
              Every patient gets a token at the desk. The list orders itself: emergencies, then urgent cases, then
              everyone else in order of arrival. Both screens update the moment anything changes.
            </p>
          </div>
          <div className="lg:col-span-7" data-reveal style={revealDelay(120)}>
            <QueueBoard />
          </div>
        </div>
      </section>

      {/* Photographs */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-4 md:grid-cols-12 md:gap-5">
          <figure data-reveal className="group flex flex-col md:col-span-7">
            <div className="aspect-[16/10] overflow-hidden rounded-xl bg-rule/40">
              <img
                src={PHOTOS.desk.src}
                alt={PHOTOS.desk.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>
            <figcaption className="mt-2 text-sm leading-relaxed text-ink-mute">
              {PHOTOS.desk.caption} <span className="text-ink-mute/70">Photo: {PHOTOS.desk.credit}.</span>
            </figcaption>
          </figure>
          <figure data-reveal className="group flex flex-col md:col-span-5" style={revealDelay(120)}>
            <div className="aspect-[4/5] min-h-0 overflow-hidden rounded-xl bg-rule/40 md:aspect-auto md:flex-1">
              <img
                src={PHOTOS.room.src}
                alt={PHOTOS.room.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>
            <figcaption className="mt-2 text-sm leading-relaxed text-ink-mute">
              {PHOTOS.room.caption} <span className="text-ink-mute/70">Photo: {PHOTOS.room.credit}.</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* How a visit moves */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-rule">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <h2 data-reveal className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            How a visit moves through the clinic
          </h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-rule">
            <li data-reveal className="md:pr-10" style={revealDelay(0)}>
              <h3 className="font-display text-2xl font-bold text-ink">At the desk</h3>
              <p className="mt-3 max-w-[48ch] leading-relaxed text-ink-soft">
                The nurse registers the patient: name, age, complaint, vitals and pain level. Returning patients
                come up by name or phone with their past visits. The app suggests a level from the vitals. The
                nurse can change it.
              </p>
            </li>
            <li data-reveal className="md:px-10" style={revealDelay(90)}>
              <h3 className="font-display text-2xl font-bold text-ink">In the queue</h3>
              <p className="mt-3 max-w-[48ch] leading-relaxed text-ink-soft">
                Emergency cases go to the front, urgent cases next, and everyone else waits in order of arrival.
                Wait times count up on screen. Edits and cancellations show on both screens at once.
              </p>
            </li>
            <li data-reveal className="md:pl-10" style={revealDelay(180)}>
              <h3 className="font-display text-2xl font-bold text-ink">In the room</h3>
              <p className="mt-3 max-w-[48ch] leading-relaxed text-ink-soft">
                The doctor calls the next patient with one tap and sees vitals, complaint and history. Diagnosis,
                notes and prescription save as they are typed. Closing the case frees the room.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* Triage levels */}
      <section className="border-t border-rule">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <h2 data-reveal className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Three levels. One rule.
          </h2>
          <p data-reveal className="mt-3 max-w-[60ch] leading-relaxed text-ink-soft" style={revealDelay(60)}>
            The app suggests a level from what the nurse enters. The nurse has the final say, and the queue follows
            the level.
          </p>
          <ul className="mt-10 divide-y divide-rule border-y border-rule">
            {LEVELS.map(({ level, triggers, effect }, i) => (
              <li
                key={level}
                data-reveal
                className="group grid gap-3 py-6 md:grid-cols-12 md:gap-8"
                style={revealDelay(i * 80)}
              >
                <div className="flex items-center gap-3 md:col-span-3">
                  <span
                    className={`h-9 w-1.5 shrink-0 rounded-sm transition-all duration-300 ease-out group-hover:h-11 group-hover:w-2.5 ${LEVEL_SWATCH[level]}`}
                    aria-hidden="true"
                  />
                  <h3 className={`font-display text-2xl font-bold ${LEVEL_TEXT[level]}`}>{LEVEL_LABEL[level]}</h3>
                </div>
                <p className="leading-relaxed text-ink-soft md:col-span-6">{triggers}</p>
                <p className="font-medium leading-relaxed text-ink md:col-span-3">{effect}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Also in the app */}
      <section className="border-t border-rule">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <h2 data-reveal className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Also in the app
          </h2>
          <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Returning patients', 'Type a name or phone number and the history comes up.'],
              ['Drafts that save themselves', 'Diagnosis, notes and prescriptions save as the doctor types.'],
              ['Printed slips', 'Print a prescription, visit pass or referral slip from the screen.'],
              ['End-of-day numbers', 'Patients seen, average wait and average consultation time.'],
              ['Runs on the clinic’s Wi-Fi', 'Phones and tablets on the same network open it by the clinic’s address.'],
              ['Emergency alert', 'When an emergency is registered, the doctor sees it without leaving the current patient.'],
            ].map(([term, detail], i) => (
              <div key={term} data-reveal style={revealDelay((i % 3) * 80)}>
                <dt className="font-semibold text-ink">{term}</dt>
                <dd className="mt-1 leading-relaxed text-ink-soft">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="font-display text-lg font-bold text-ink">MediTrack</p>
            <p className="mt-1 text-sm text-ink-mute">Built for single-doctor community clinics.</p>
          </div>
          <button type="button" onClick={onSignIn} className="btn-primary">
            Sign in
          </button>
        </div>
      </footer>

      </div>
    </div>
  );
};
