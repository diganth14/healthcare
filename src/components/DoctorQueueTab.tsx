import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Clock, 
  MapPin, 
  Heart, 
  Activity, 
  Droplets,
  MessageSquare,
  ShieldCheck,
  Check,
  Filter,
  ArrowUp,
  ArrowDown,
  Sparkles,
  RotateCcw,
  PlusCircle,
  FileText
} from 'lucide-react';
import { CardTilt } from './CardTilt';
import { QuickAdviceModal } from './QuickAdviceModal';
import { Language, PatientRecord, RiskLevel } from '../types';
import { translations } from '../translations';

interface DoctorQueueTabProps {
  language: Language;
  patients: PatientRecord[];
  onUpdatePatientAdvice: (patientId: string, adviceText: string) => void;
  onSelectPatient: (patient: PatientRecord) => void;
  highlightedPatientId?: string | null;
  onResetQueue?: () => void;
}

export const DoctorQueueTab: React.FC<DoctorQueueTabProps> = ({
  language,
  patients,
  onUpdatePatientAdvice,
  onSelectPatient,
  highlightedPatientId,
  onResetQueue,
}) => {
  const t = translations[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | RiskLevel>('all');
  const [activeModalPatient, setActiveModalPatient] = useState<PatientRecord | null>(null);

  // STRICT SORTING: 
  // 1. Critical Emergency (Severity 70-100) ALWAYS at the TOP
  // 2. Urgent (Severity 40-69) in the MIDDLE
  // 3. Routine / Less Health Problem (Severity 5-39) ALWAYS at the LAST OF THE QUEUE
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      const scoreA = a.result?.severityScore ?? (a.result?.riskLevel === 'emergency' ? 88 : a.result?.riskLevel === 'urgent' ? 52 : 16);
      const scoreB = b.result?.severityScore ?? (b.result?.riskLevel === 'emergency' ? 88 : b.result?.riskLevel === 'urgent' ? 52 : 16);

      // Higher acuity/severity score first!
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      // If same score, newest patient first
      return b.timestamp - a.timestamp;
    });
  }, [patients]);

  // Filtered by search query and risk level filter pills
  const filteredPatients = useMemo(() => {
    return sortedPatients.filter(patient => {
      const matchesSearch =
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.refId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        selectedFilter === 'all' || patient.result.riskLevel === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [sortedPatients, searchTerm, selectedFilter]);

  const emergencyCount = patients.filter(p => p.result.riskLevel === 'emergency').length;
  const urgentCount = patients.filter(p => p.result.riskLevel === 'urgent').length;
  const routineCount = patients.filter(p => p.result.riskLevel === 'routine').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header & Stats Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {t.queueView.title}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 border border-sky-200">
                  Priority Auto-Sorted
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {t.queueView.subtitle}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons for Testing Sorting */}
          <div className="flex items-center gap-2">
            {onResetQueue && (
              <button
                type="button"
                onClick={onResetQueue}
                title="Reset queue to demo preset patients"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Demo</span>
              </button>
            )}
          </div>
        </div>

        {/* Sorting Rule Explanation Badge */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-coral/10 via-amber/10 to-mint/10 border border-slate-200/90 mb-5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-coral animate-ping" />
            <span className="text-coral-dark font-extrabold">Top of Queue (Rank #1):</span>
            <span>Critical Patients (Emergency Hospitalization)</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-800">
            <ArrowDown className="w-3.5 h-3.5 text-mint" />
            <span className="font-extrabold text-emerald-700">Bottom of Queue (Last):</span>
            <span>Less Health Problem Cases (Routine Home Care)</span>
          </div>
        </div>

        {/* Acuity Breakdown Counter */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="px-3 py-1.5 rounded-xl bg-coral/10 text-coral border border-coral/30 text-xs font-black flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            {emergencyCount} Critical Emergencies (Top)
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber/10 text-amber-900 border border-amber/30 text-xs font-black flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {urgentCount} Urgent Cases
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-mint/10 text-emerald-800 border border-mint/30 text-xs font-black flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {routineCount} Routine Cases (Last)
          </span>
        </div>

        {/* Search bar & Filter Pills */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t.queueView.searchPlaceholder}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: t.queueView.filterAll, count: patients.length },
              { id: 'emergency', label: t.queueView.filterEmergency, count: emergencyCount },
              { id: 'urgent', label: t.queueView.filterUrgent, count: urgentCount },
              { id: 'routine', label: t.queueView.filterRoutine, count: routineCount },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedFilter === f.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white/70 text-slate-600 border-slate-200/80 hover:bg-white'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Priority Queue Cards */}
      {filteredPatients.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800">
            {t.queueView.emptyTitle}
          </h3>
          <p className="text-xs text-slate-500">
            {t.queueView.emptyDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map((patient, index) => {
            const isEmergency = patient.result.riskLevel === 'emergency';
            const isUrgent = patient.result.riskLevel === 'urgent';
            const isRoutine = patient.result.riskLevel === 'routine';
            const hasAdvice = patient.queueStatus === 'advice_sent';
            const isNewlyAdded = patient.id === highlightedPatientId;
            const rank = index + 1;
            const total = filteredPatients.length;
            const severityScore = patient.result.severityScore ?? (isEmergency ? 90 : isUrgent ? 55 : 15);

            return (
              <CardTilt
                key={patient.id}
                className={`glass-card rounded-3xl p-5 sm:p-6 transition-all border ${
                  isNewlyAdded
                    ? 'ring-2 ring-sky-500 shadow-lg shadow-sky-500/20'
                    : ''
                } ${
                  isEmergency
                    ? 'border-coral/50 bg-gradient-to-r from-coral/10 via-white/80 to-white/90 shadow-coral/15 hover:shadow-coral/25'
                    : isUrgent
                    ? 'border-amber/40 bg-gradient-to-r from-amber/10 via-white/80 to-white/90 shadow-amber/15 hover:shadow-amber/25'
                    : 'border-slate-200/80 hover:border-mint/50 bg-white/85'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Details */}
                  <div className="space-y-2.5 flex-1">
                    {/* Top Row: Priority Rank + Ref ID + Risk Badge + Location */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Priority Rank Indicator */}
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono tracking-tight flex items-center gap-1 ${
                        isEmergency
                          ? 'bg-coral text-white shadow-sm shadow-coral/30'
                          : isUrgent
                          ? 'bg-amber text-slate-900 shadow-sm shadow-amber/20'
                          : 'bg-mint text-white'
                      }`}>
                        {isEmergency && <ArrowUp className="w-3.5 h-3.5" />}
                        {isRoutine && <ArrowDown className="w-3.5 h-3.5" />}
                        <span>#{rank} of {total}</span>
                        <span className="opacity-90 font-sans font-extrabold text-[10px] ml-0.5">
                          ({isEmergency ? 'Critical' : isUrgent ? 'Urgent' : 'Routine / Mild'})
                        </span>
                      </span>

                      {/* Newly Added Highlight Badge */}
                      {isNewlyAdded && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500 text-white animate-pulse flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Newly Added to Queue
                        </span>
                      )}

                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        {patient.refId}
                      </span>

                      {/* Risk Badge */}
                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-black tracking-wide flex items-center gap-1.5 ${
                          isEmergency
                            ? 'bg-coral/15 text-coral border border-coral/30'
                            : isUrgent
                            ? 'bg-amber/15 text-amber-900 border border-amber/30'
                            : 'bg-mint/15 text-emerald-800 border border-mint/30'
                        }`}
                      >
                        {isEmergency && <Flame className="w-3.5 h-3.5" />}
                        {isUrgent && <AlertTriangle className="w-3.5 h-3.5" />}
                        {patient.result.badgeLabel}
                      </span>

                      {patient.location && (
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {patient.location}
                        </span>
                      )}

                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1 ml-auto md:ml-0">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {patient.result.assessedAt}
                      </span>
                    </div>

                    {/* Patient Name & Age + Severity Bar */}
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {patient.name}
                      </h3>
                      <span className="text-xs font-bold text-slate-500 font-mono">
                        ({patient.age} yrs{patient.gender ? `, ${patient.gender}` : ''})
                      </span>

                      {/* Acuity Severity Score Badge */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
                        <span>Acuity Score:</span>
                        <span className={`font-black ${
                          isEmergency ? 'text-coral' : isUrgent ? 'text-amber' : 'text-mint'
                        }`}>
                          {severityScore}/100
                        </span>
                      </div>
                    </div>

                    {/* Main Warning Sign */}
                    <div className="text-xs text-slate-700 font-semibold bg-white/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2 shadow-xs">
                      <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                        isEmergency ? 'bg-coral' : isUrgent ? 'bg-amber' : 'bg-mint'
                      }`} />
                      <span>
                        <strong className="text-slate-900 font-bold">Primary Clinical Flag: </strong>
                        {patient.result.whyReasons[0] || 'Vitals stable. Routine assessment.'}
                      </span>
                    </div>

                    {/* Pre-conditions & Vitals pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {patient.conditions.map(c => (
                        <span key={c} className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                          {c === 'diabetes' ? 'Diabetes' : c === 'high_bp' ? 'Hypertension' : 'Pregnancy'}
                        </span>
                      ))}

                      {patient.hasDevices ? (
                        <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                          SpO2: <strong className={patient.vitals.spo2 < 90 ? 'text-coral' : 'text-slate-800'}>{patient.vitals.spo2}%</strong> • HR: <strong>{patient.vitals.heartRate} bpm</strong> • Temp: <strong>{patient.vitals.temperature}°C</strong>
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                          Rural Visual Check: {patient.ruralVitals.hardToBreathe ? '⚠️ Breathing Gasp' : 'Breathing OK'} • {patient.ruralVitals.burningHot ? '⚠️ Burning Hot' : 'Temp OK'}
                        </span>
                      )}
                    </div>

                    {/* Physician Advice if Sent */}
                    {hasAdvice && patient.doctorAdvice && (
                      <div className="mt-2 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-0.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Physician Order Dispatched:</span>
                        </div>
                        <p className="italic font-medium">{patient.doctorAdvice}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveModalPatient(patient)}
                      className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wide transition-all flex items-center gap-2 shadow-sm whitespace-nowrap cursor-pointer ${
                        hasAdvice
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
                          : isEmergency
                          ? 'bg-coral text-white hover:bg-coral-dark shadow-coral/30 hover:scale-105 active:scale-95'
                          : isUrgent
                          ? 'bg-amber text-slate-900 hover:bg-amber-light shadow-amber/20 hover:scale-105 active:scale-95'
                          : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{hasAdvice ? t.queueView.adviceSentBadge : t.queueView.connectBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectPatient(patient)}
                      className="text-xs text-sky-600 font-bold hover:underline py-1 px-2 flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Referral Pass &rarr;</span>
                    </button>
                  </div>
                </div>
              </CardTilt>
            );
          })}
        </div>
      )}

      {/* Physician Advice & Tele-Consult Modal */}
      {activeModalPatient && (
        <QuickAdviceModal
          patient={activeModalPatient}
          onClose={() => setActiveModalPatient(null)}
          onSubmitAdvice={(patientId, adviceText) => {
            onUpdatePatientAdvice(patientId, adviceText);
            setActiveModalPatient(null);
          }}
        />
      )}
    </div>
  );
};
