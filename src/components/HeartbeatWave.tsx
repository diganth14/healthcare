import React, { useEffect, useRef } from 'react';
import { RiskLevel } from '../types';

interface HeartbeatWaveProps {
  riskLevel?: RiskLevel;
  bpm?: number;
}

export const HeartbeatWave: React.FC<HeartbeatWaveProps> = ({
  riskLevel = 'routine',
  bpm = 74,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colorMap = {
    routine: { stroke: 'rgba(16, 185, 129, 0.75)', glow: '#10B981' },
    urgent: { stroke: 'rgba(245, 158, 11, 0.85)', glow: '#F59E0B' },
    emergency: { stroke: 'rgba(244, 63, 94, 0.95)', glow: '#F43F5E' },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = 48;
    };
    resize();
    window.addEventListener('resize', resize);

    // Heartbeat profile (P-Q-R-S-T wave template normalized)
    const getBeatY = (progress: number): number => {
      // progress is 0 to 1
      if (progress < 0.15) return 0; // baseline
      if (progress < 0.22) return -3 * Math.sin(((progress - 0.15) / 0.07) * Math.PI); // P wave
      if (progress < 0.27) return 0; // PR segment
      if (progress < 0.30) return 2.5 * Math.sin(((progress - 0.27) / 0.03) * Math.PI); // Q dip
      if (progress < 0.35) return -20 * Math.sin(((progress - 0.30) / 0.05) * Math.PI); // R peak
      if (progress < 0.40) return 6 * Math.sin(((progress - 0.35) / 0.05) * Math.PI); // S dip
      if (progress < 0.50) return 0; // ST segment
      if (progress < 0.65) return -5 * Math.sin(((progress - 0.50) / 0.15) * Math.PI); // T wave
      return 0; // baseline
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const midY = canvas.height / 2;
      const speed = riskLevel === 'emergency' ? 3.4 : riskLevel === 'urgent' ? 2.4 : 1.6;
      offset = (offset + speed) % 240;

      const activeColor = colorMap[riskLevel] || colorMap.routine;

      // Draw faint baseline guideline
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Draw ECG wave
      ctx.beginPath();
      ctx.strokeStyle = activeColor.stroke;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = activeColor.glow;
      ctx.shadowBlur = 8;

      const cycleLength = 240; // distance between beats in px
      for (let x = 0; x <= width; x += 3) {
        const cyclePos = ((x - offset) % cycleLength + cycleLength) % cycleLength;
        const progress = cyclePos / cycleLength;
        const yOffset = getBeatY(progress);
        const y = midY + yOffset;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Reset shadow for performance
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [riskLevel]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none select-none overflow-hidden bg-gradient-to-t from-white/90 via-white/40 to-transparent backdrop-blur-[2px] pt-2">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-slate-400 pb-1">
        <div className="flex items-center gap-2 font-mono">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                riskLevel === 'emergency'
                  ? 'bg-coral'
                  : riskLevel === 'urgent'
                  ? 'bg-amber'
                  : 'bg-mint'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                riskLevel === 'emergency'
                  ? 'bg-coral'
                  : riskLevel === 'urgent'
                  ? 'bg-amber'
                  : 'bg-mint'
              }`}
            />
          </span>
          <span className="text-[11px] font-medium tracking-wider text-slate-500 uppercase">
            Live Rhythm Monitor:
          </span>
          <span className="text-[12px] font-bold text-slate-700">{bpm} BPM</span>
        </div>
        <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
          Offline Neural Engine v2.4 • Low-Latency Tele-Triage
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full block" />
    </div>
  );
};
