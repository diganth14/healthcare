import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Send, 
  QrCode, 
  Printer, 
  Building2, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BioSphere3D } from './BioSphere3D';
import { CardTilt } from './CardTilt';
import { Language, PatientRecord } from '../types';
import { translations } from '../translations';

interface ResultReferralTabProps {
  language: Language;
  patient: PatientRecord | null;
  onSendToDoctor: (patient: PatientRecord) => void;
  onGoToQueue: () => void;
  onStartNewCheck: () => void;
}

export const ResultReferralTab: React.FC<ResultReferralTabProps> = ({
  language,
  patient,
  onSendToDoctor,
  onGoToQueue,
  onStartNewCheck,
}) => {
  const t = translations[language];
  const [isSent, setIsSent] = useState(true);

  if (!patient || !patient.result) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-inner">
          <Stethoscope className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            No Active Triage Result
          </h3>
          <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
            Please run an assessment on a patient in Tab 1 first, or select one from the quick demo options.
          </p>
        </div>
        <button
          onClick={onStartNewCheck}
          className="px-6 py-3 rounded-full bg-sky-600 text-white font-bold text-sm shadow-md shadow-sky-500/25 hover:bg-sky-700 transition-all inline-flex items-center gap-2"
        >
          <span>{t.tabs.checkPatient}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const result = patient.result;
  const isEmergency = result.riskLevel === 'emergency';
  const isUrgent = result.riskLevel === 'urgent';
  const isRoutine = result.riskLevel === 'routine';

  const handleSendToDoctor = () => {
    setIsSent(true);
    onSendToDoctor(patient);

    // Fire joyful confetti for community health workers
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#0EA5E9', '#10B981', '#38BDF8'],
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24">
      {/* 3D Bio-Sphere Reacting in Real-Time at the Hero Top */}
      <div className="flex flex-col items-center justify-center pt-2">
        <BioSphere3D riskLevel={result.riskLevel} size={250} />
        <div className="text-center mt-3">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
            Bio-Aura Frequency Resonance
          </span>
          <div className="text-sm font-semibold text-slate-600">
            {isEmergency ? 'Critical Pulse State (4.0 Hz)' : isUrgent ? 'Elevated Pulse State (2.3 Hz)' : 'Calm Resting State (1.0 Hz)'}
          </div>
        </div>
      </div>

      {/* Main Status Badge */}
      <div className="flex justify-center">
        <div
          className={`px-8 py-5 rounded-3xl text-center border shadow-xl transition-all max-w-2xl w-full ${
            isEmergency
              ? 'bg-coral/10 border-coral/40 text-coral shadow-coral/15 ring-2 ring-coral/20'
              : isUrgent
              ? 'bg-amber/10 border-amber/40 text-amber-900 shadow-amber/15 ring-2 ring-amber/20'
              : 'bg-mint/10 border-mint/40 text-emerald-900 shadow-mint/15 ring-2 ring-mint/20'
          }`}
        >
          <div className="flex items-center justify-center gap-2.5 mb-1.5">
            {isEmergency ? (
              <Flame className="w-7 h-7 text-coral animate-bounce" />
            ) : isUrgent ? (
              <AlertTriangle className="w-7 h-7 text-amber" />
            ) : (
              <CheckCircle2 className="w-7 h-7 text-mint" />
            )}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
              {result.badgeLabel}
            </h1>
          </div>
          <p className="text-sm font-semibold opacity-90 max-w-lg mx-auto">
            {result.badgeSub}
          </p>
        </div>
      </div>

      {/* Section: Why AI Chose This & What To Do Next */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Why AI Chose This */}
        <CardTilt className="glass-card rounded-3xl p-6 sm:p-7">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              {t.resultView.whyAiChose}
            </h3>
          </div>
          <ul className="space-y-3">
            {result.whyReasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                  isEmergency ? 'bg-coral' : isUrgent ? 'bg-amber' : 'bg-mint'
                }`} />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </CardTilt>

        {/* What To Do Next */}
        <CardTilt className="glass-card rounded-3xl p-6 sm:p-7">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              {t.resultView.whatNext}
            </h3>
          </div>
          <div className="space-y-3">
            {result.firstAidSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-xs sm:text-sm text-slate-700 font-semibold leading-snug">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </CardTilt>
      </div>

      {/* Digital Referral Ticket */}
      <CardTilt className="glass-card rounded-3xl p-6 sm:p-8 border-2 border-white/90 shadow-2xl relative overflow-hidden print:shadow-none">
        {/* Subtle decorative ticket notch */}
        <div className="hidden sm:block absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#F8FAFC] border-r border-slate-200" />
        <div className="hidden sm:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#F8FAFC] border-l border-slate-200" />

        <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 pb-4 mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-sky-600 uppercase">
                {t.resultView.referralCardTitle}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                {result.referralId}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              {patient.name} ({patient.age} yrs)
            </h2>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium block">
              Facility Routing:
            </span>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              {result.recommendedDepartment}
            </span>
          </div>
        </div>

        {/* Middle QR Code and Clinical Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center">
            <div className="p-2 bg-slate-900 rounded-xl">
              <QrCode className="w-28 h-28 text-white" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-2">
              SCAN AT DISTRICT CHC
            </span>
          </div>

          {/* Vitals summary block */}
          <div className="sm:col-span-2 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-white/70 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">SpO2</span>
                <span className="text-base font-extrabold text-slate-800 font-mono">
                  {patient.hasDevices ? `${patient.vitals.spo2}%` : (patient.ruralVitals.hardToBreathe ? 'Low (Gasping)' : 'Normal')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/70 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Heart Rate</span>
                <span className="text-base font-extrabold text-slate-800 font-mono">
                  {patient.hasDevices ? `${patient.vitals.heartRate} bpm` : (patient.ruralVitals.dizzyOrFaint ? 'Fast/Faint' : 'Normal')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/70 border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Temp</span>
                <span className="text-base font-extrabold text-slate-800 font-mono">
                  {patient.hasDevices ? `${patient.vitals.temperature}°C` : (patient.ruralVitals.burningHot ? 'High Fever' : 'Normal')}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 font-medium">
              <span className="font-bold text-slate-800 block mb-0.5">Triage Clinical Assessment:</span>
              {result.summaryNote}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Logged at {result.assessedAt}
              </span>
              <span>Encrypted SHA-256 Rural EHR</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Send to Doctor & Print */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-full border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.resultView.printPass}</span>
          </button>

          <div className="flex items-center gap-3">
            {isSent ? (
              <div className="flex items-center gap-2">
                <span className="px-4 py-2.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {t.resultView.sentToQueueSuccess}
                </span>
                <button
                  onClick={onGoToQueue}
                  className="px-5 py-2.5 rounded-full bg-sky-600 text-white text-xs font-black shadow-md shadow-sky-500/25 hover:bg-sky-700 transition-all flex items-center gap-1.5"
                >
                  <span>{t.tabs.doctorQueue}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendToDoctor}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-sky-500 via-sky-600 to-mint text-white font-extrabold text-sm shadow-lg shadow-sky-500/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{t.resultView.sendToDoctorOffline}</span>
              </button>
            )}
          </div>
        </div>
      </CardTilt>
    </div>
  );
};
