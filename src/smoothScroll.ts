import Lenis from 'lenis';

let lenis: Lenis | null = null;

/**
 * Start Lenis smooth scrolling (landing page only).
 * Returns a cleanup function that tears it down again.
 */
export function startSmoothScroll(): () => void {
  if (lenis) return () => {};

  lenis = new Lenis({
    autoRaf: true,
    smoothWheel: true,
    lerp: 0.1,
    // Smooth in-page anchor links, landing just below the sticky header
    anchors: { offset: -72 },
    // Disables smoothing when the OS asks for reduced motion
    respectReducedMotion: true,
  });

  return () => {
    lenis?.destroy();
    lenis = null;
  };
}

/** Pause page scrolling while a sheet or dialog is open. */
export function lockScroll(): void {
  if (lenis) {
    lenis.stop();
  } else {
    document.documentElement.style.overflow = 'hidden';
  }
}

/** Resume page scrolling after a sheet or dialog closes. */
export function unlockScroll(): void {
  if (lenis) {
    lenis.start();
  } else {
    document.documentElement.style.overflow = '';
  }
}
