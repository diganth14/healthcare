import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, 
  UserCheck, 
  PhoneCall, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Save, 
  Check, 
  History, 
  Printer, 
  BarChart2, 
  AlertCircle, 
  Sparkles, 
  Activity, 
  Heart, 
  Droplets,
  ArrowRight,
  FileText,
  User,
  ShieldCheck,
  BellRing,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../api';
import { CardTilt } from './CardTilt';
import { PrintPrescriptionModal } from './PrintPrescriptionModal';
import { 
  EmergencyAlertData, 
  QueueResponse, 
  StatsResponse, 
  User as UserType, 
  Visit 
} from '../types';

interface DoctorPortalProps {
  currentUser: UserType;
  queueData: QueueResponse;
  onRefreshQueue: () => void;
  incomingEmergencyAlert: EmergencyAlertData | null;
  onDismissEmergencyAlert: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  currentUser,
  queueData,
  onRefreshQueue,
  incomingEmergencyAlert,
  onDismissEmergencyAlert,
}) => {
  const currentVisit = queueData.inConsultation;

  // Diagnosis Draft Form State
  const [diagnosis, setDiagnosis] = useState(currentVisit?.diagnosis || '');
  const [prescription, setPrescription] = useState(currentVisit?.prescription || '');
  const [followUp, setFollowUp] = useState(currentVisit?.follow_up || '');
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // Past visits of the active patient
  const [pastVisits, setPastVisits] = useState<Visit[]>([]);
  const [showPastHistory, setShowPastHistory] = useState(false);

  // End of Day Stats
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Close Case Confirmation
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Printed prescription modal
  const [printedVisit, setPrintedVisit] = useState<Visit | null>(null);

  // Action states
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Waiting queue controls: which card is mid-request, and which is asking to confirm removal
  const [busyVisitId, setBusyVisitId] = useState<number | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);

  // Sync draft inputs when active patient changes
  useEffect(() => {
    if (currentVisit) {
      setDiagnosis(currentVisit.diagnosis || '');
      setPrescription(currentVisit.prescription || '');
      setFollowUp(currentVisit.follow_up || '');
      setDraftSavedAt(currentVisit.diagnosis ? 'Restored draft' : null);

      // Load patient's past history
      api.getVisitDetails(currentVisit.id)
        .then(res => setPastVisits(res.pastVisits || []))
        .catch(err => console.warn('Could not load past visits', err));
    } else {
      setDiagnosis('');
      setPrescription('');
      setFollowUp('');
      setPastVisits([]);
    }
  }, [currentVisit?.id]);

  // Load End of Day stats on mount and on close
  const loadStats = async () => {
    try {
      const res = await api.getTodayStats();
      setStats(res);
    } catch (err) {
      console.warn('Failed to load stats', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Debounced auto-save diagnosis draft
  const saveTimeoutRef = useRef<any>(null);

  const handleInputChange = (field: 'diagnosis' | 'prescription' | 'followUp', value: string) => {
    if (field === 'diagnosis') setDiagnosis(value);
    if (field === 'prescription') setPrescription(value);
    if (field === 'followUp') setFollowUp(value);

    if (!currentVisit) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsDraftSaving(true);
      try {
        await api.saveDiagnosis(currentVisit.id, {
          diagnosis: field === 'diagnosis' ? value : diagnosis,
          prescription: field === 'prescription' ? value : prescription,
          follow_up: field === 'followUp' ? value : followUp,
        });
        setDraftSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.warn('Draft auto-save failed', err);
      } finally {
        setIsDraftSaving(false);
      }
    }, 700);
  };

  // Call Next Patient
  const handleCallNext = async () => {
    setActionError(null);
    setIsCallingNext(true);
    try {
      await api.callNextPatient();
      onRefreshQueue();
      loadStats();
    } catch (err: any) {
      setActionError(err.message || 'Failed to call next patient.');
    } finally {
      setIsCallingNext(false);
    }
  };

  // Confirm Close Case
  const handleConfirmCloseCase = async () => {
    if (!currentVisit) return;
    if (!diagnosis.trim()) {
      setActionError('Diagnosis is required before closing case.');
      setShowCloseConfirm(false);
      return;
    }

    setIsClosing(true);
    setActionError(null);
    try {
      // Ensure latest diagnosis is saved first
      await api.saveDiagnosis(currentVisit.id, {
        diagnosis: diagnosis.trim(),
        prescription: prescription.trim(),
        follow_up: followUp.trim(),
      });

      const res = await api.closeCase(currentVisit.id);
      setShowCloseConfirm(false);
      onRefreshQueue();
      loadStats();

      // Immediately open printable prescription pass
      setPrintedVisit(res.visit);
    } catch (err: any) {
      setActionError(err.message || 'Failed to close case.');
    } finally {
      setIsClosing(false);
    }
  };

  const waitingList = queueData.waitingQueue || [];
  const nextInLine = waitingList.length > 0 ? waitingList[0] : null;

  // Move a waiting patient one place up or down the queue
  const handleMoveVisit = async (visitId: number, direction: 'up' | 'down') => {
    setActionError(null);
    setBusyVisitId(visitId);
    try {
      await api.moveVisit(visitId, direction);
      onRefreshQueue();
    } catch (err: any) {
      setActionError(err.message || 'Failed to move patient.');
    } finally {
      setBusyVisitId(null);
    }
  };

  // Remove a waiting patient from the queue (the visit is marked cancelled)
  const handleRemoveVisit = async (visitId: number) => {
    setActionError(null);
    setBusyVisitId(visitId);
    try {
      await api.cancelVisit(visitId);
      setConfirmRemoveId(null);
      onRefreshQueue();
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove patient.');
    } finally {
      setBusyVisitId(null);
    }
  };

  // The waiting queue with the doctor's move and remove controls, shown beside the room in both states
  const waitingQueuePanel = (
            <div className="glass-card rounded-3xl p-5 border border-white/90">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Waiting Queue ({waitingList.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Live Sync</span>
              </div>

              {waitingList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                  Queue is clear. No patients waiting.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {/* Cards slide to their new place when the order changes, and collapse away when removed */}
                  <AnimatePresence initial={false}>
                  {waitingList.map((wVisit, idx) => (
                    <motion.div
                      key={wVisit.id}
                      layout
                      initial={false}
                      exit={{ opacity: 0, scale: 0.96, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                      transition={{
                        layout: { type: 'spring', stiffness: 420, damping: 38 },
                        opacity: { duration: 0.2 },
                        height: { duration: 0.28 },
                      }}
                      className={`p-3 rounded-2xl border text-xs space-y-1 overflow-hidden transition-colors ${
                        idx === 0
                          ? 'bg-sky-50/70 border-sky-300'
                          : wVisit.emergency_level === 'emergency'
                          ? 'bg-coral/5 border-coral/30'
                          : wVisit.emergency_level === 'urgent'
                          ? 'bg-amber/5 border-amber/30'
                          : 'bg-white/70 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-[11px] text-slate-800">
                          #{wVisit.token_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          wVisit.emergency_level === 'emergency'
                            ? 'bg-coral text-white'
                            : wVisit.emergency_level === 'urgent'
                            ? 'bg-amber text-slate-900'
                            : 'bg-mint text-white'
                        }`}>
                          {wVisit.emergency_level}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">
                        {wVisit.patient_name} ({wVisit.patient_age}y)
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {wVisit.complaint}
                      </p>

                      {/* Queue controls: move up or down, or remove from the queue */}
                      <div className="flex items-center justify-between pt-1.5">
                        {confirmRemoveId === wVisit.id ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-coral">Remove from queue?</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVisit(wVisit.id)}
                              disabled={busyVisitId === wVisit.id}
                              className="px-2 py-1 rounded-lg text-[11px] font-black text-white bg-coral hover:bg-coral-dark disabled:opacity-60 transition-colors"
                            >
                              {busyVisitId === wVisit.id ? 'Removing…' : 'Yes, remove'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveId(null)}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveVisit(wVisit.id, 'up')}
                                disabled={idx === 0 || busyVisitId !== null}
                                aria-label={`Move ${wVisit.patient_name} up the queue`}
                                title="Move up"
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white/80 text-slate-600 hover:border-sky-300 hover:text-sky-700 disabled:opacity-35 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-colors"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveVisit(wVisit.id, 'down')}
                                disabled={idx === waitingList.length - 1 || busyVisitId !== null}
                                aria-label={`Move ${wVisit.patient_name} down the queue`}
                                title="Move down"
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white/80 text-slate-600 hover:border-sky-300 hover:text-sky-700 disabled:opacity-35 disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-colors"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveId(wVisit.id)}
                              disabled={busyVisitId !== null}
                              aria-label={`Remove ${wVisit.patient_name} from the queue`}
                              title="Remove from queue"
                              className="h-7 px-2 flex items-center gap-1 rounded-lg border border-slate-200 bg-white/80 text-[11px] font-bold text-slate-600 hover:border-coral/40 hover:text-coral disabled:opacity-35 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Floating Non-Intrusive Emergency Toast Alert */}
      {incomingEmergencyAlert && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md w-full p-4 rounded-3xl bg-coral text-white shadow-2xl border-2 border-white/60 animate-bounce flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest bg-white/30 px-2 py-0.5 rounded-full inline-block mb-1">
                🚨 Emergency Patient Arrived in Queue
              </span>
              <h4 className="font-black text-sm">
                Token #{incomingEmergencyAlert.token_number}: {incomingEmergencyAlert.patient_name}
              </h4>
              <p className="text-xs text-coral-100 font-medium mt-0.5">
                {incomingEmergencyAlert.complaint}
              </p>
              <span className="text-[10px] text-coral-200 mt-1 block font-mono">
                Top of queue • Ready for call when room is available
              </span>
            </div>
          </div>
          <button
            onClick={onDismissEmergencyAlert}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Doctor Header Bar with End of Day Stats button */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl glass-card border border-white/90">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-lg border border-sky-100">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Consulting Room #1 • {currentUser.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                Online & Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Queue: {waitingList.length} patients waiting • Room status:{' '}
              <strong className={currentVisit ? 'text-sky-700' : 'text-emerald-600'}>
                {currentVisit ? `In Consultation (Token #${currentVisit.token_number})` : 'Free / Unoccupied'}
              </strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowStatsModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-xs flex items-center gap-2 transition-all"
        >
          <BarChart2 className="w-4 h-4 text-sky-600" />
          <span>End-of-Day Stats ({stats?.patientsSeen || 0} Seen)</span>
        </button>
      </div>

      {actionError && (
        <div className="p-4 rounded-2xl bg-coral/10 border border-coral/30 text-xs font-bold text-coral flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ===================== CONSULTING ROOM STATE ===================== */}
      {!currentVisit ? (
        /* ROOM IS FREE: Call Next Patient card, with the waiting queue beside it */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
        <CardTilt className="p-8 sm:p-12 rounded-4xl glass-card border-2 border-dashed border-sky-200 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-sky-500 to-mint flex items-center justify-center text-white shadow-xl shadow-sky-500/20">
            <UserCheck className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Consulting Room is Free
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Ready for the next patient. Queue automatically orders critical emergencies first, followed by urgent and normal cases.
            </p>
          </div>

          {nextInLine ? (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-left space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 block">
                Next Patient in Line to Enter:
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-black text-xs text-slate-700 mr-2">
                    Token #{nextInLine.token_number}
                  </span>
                  <span className="font-extrabold text-sm text-slate-900">
                    {nextInLine.patient_name}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">
                    ({nextInLine.patient_age}y, {nextInLine.patient_gender})
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  nextInLine.emergency_level === 'emergency'
                    ? 'bg-coral text-white animate-pulse'
                    : nextInLine.emergency_level === 'urgent'
                    ? 'bg-amber text-slate-900'
                    : 'bg-mint text-white'
                }`}>
                  {nextInLine.emergency_level}
                </span>
              </div>
              <p className="text-xs text-slate-600 italic">
                "{nextInLine.complaint}"
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-400 font-medium">
              Waiting queue is currently empty.
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleCallNext}
              disabled={isCallingNext || !nextInLine}
              className="px-10 py-4 rounded-full font-black text-sm tracking-wide text-white bg-gradient-to-r from-sky-500 via-sky-600 to-mint shadow-lg shadow-sky-500/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 mx-auto disabled:opacity-50 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{isCallingNext ? 'Calling Patient...' : nextInLine ? `Call Next Patient (Token #${nextInLine.token_number})` : 'Queue Empty'}</span>
            </button>
          </div>
        </CardTilt>
        </div>
        <div className="space-y-4">{waitingQueuePanel}</div>
        </div>
      ) : (
        /* ROOM IS OCCUPIED: Comprehensive Active Patient Details + Diagnosis Form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Patient Records & Diagnosis Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Patient Clinical Card */}
            <CardTilt className="glass-card rounded-3xl p-6 sm:p-7 border-2 border-sky-400/80 shadow-xl shadow-sky-500/10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-slate-900 text-white">
                    Token #{currentVisit.token_number}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide flex items-center gap-1 ${
                    currentVisit.emergency_level === 'emergency'
                      ? 'bg-coral text-white animate-pulse'
                      : currentVisit.emergency_level === 'urgent'
                      ? 'bg-amber text-slate-900'
                      : 'bg-mint text-white'
                  }`}>
                    {currentVisit.emergency_level === 'emergency' && <Flame className="w-3.5 h-3.5" />}
                    {currentVisit.emergency_level === 'urgent' && <AlertTriangle className="w-3.5 h-3.5" />}
                    {currentVisit.emergency_level} Case
                  </span>
                </div>

                <div className="text-right text-xs text-slate-500 font-medium">
                  <span>Arrived {new Date(currentVisit.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {currentVisit.patient_name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold mt-0.5">
                    <span>{currentVisit.patient_age} years old</span>
                    <span>•</span>
                    <span>{currentVisit.patient_gender}</span>
                    {currentVisit.patient_phone && (
                      <>
                        <span>•</span>
                        <span className="font-mono">📞 {currentVisit.patient_phone}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Patient pre-conditions */}
                {currentVisit.patient_conditions && currentVisit.patient_conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentVisit.patient_conditions.map(c => (
                      <span key={c} className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                        {c === 'diabetes' ? 'Diabetes' : c === 'high_bp' ? 'Hypertension' : 'Pregnancy'}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Vitals Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/90 border border-slate-200/90 mb-5 text-center text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">SpO2</span>
                  <span className={`font-mono text-base font-black ${
                    (currentVisit.vitals_spo2 || 100) < 90 ? 'text-coral' : (currentVisit.vitals_spo2 || 100) < 95 ? 'text-amber' : 'text-mint'
                  }`}>
                    {currentVisit.vitals_spo2 ? `${currentVisit.vitals_spo2}%` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Heart Rate</span>
                  <span className="font-mono text-base font-black text-slate-800">
                    {currentVisit.vitals_heart_rate ? `${currentVisit.vitals_heart_rate} bpm` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Temperature</span>
                  <span className="font-mono text-base font-black text-slate-800">
                    {currentVisit.vitals_temperature ? `${currentVisit.vitals_temperature}°C` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Pressure</span>
                  <span className="font-mono text-base font-black text-slate-800">
                    {currentVisit.vitals_bp_systolic && currentVisit.vitals_bp_diastolic
                      ? `${currentVisit.vitals_bp_systolic}/${currentVisit.vitals_bp_diastolic}`
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Chief Complaint, Pain & Nurse Notes */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                      Chief Complaint & Symptoms:
                    </span>
                    {currentVisit.pain_level !== undefined && (
                      <span className={`font-mono font-black px-2 py-0.5 rounded-md ${
                        currentVisit.pain_level >= 8 ? 'bg-coral text-white' : 'bg-slate-200 text-slate-800'
                      }`}>
                        Pain: {currentVisit.pain_level}/10
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {currentVisit.complaint}
                  </p>
                </div>

                {currentVisit.nurse_notes && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-slate-700">
                    <strong className="text-amber-900 block text-[10px] uppercase font-black">Nurse Triage Notes:</strong>
                    <span>{currentVisit.nurse_notes}</span>
                  </div>
                )}
              </div>

              {/* Collapsible Past Visits of Patient */}
              {pastVisits.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setShowPastHistory(!showPastHistory)}
                    className="flex items-center justify-between w-full text-xs font-bold text-sky-700 hover:text-sky-800"
                  >
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      <span>Patient Past Clinic Visits ({pastVisits.length} prior recorded)</span>
                    </span>
                    <span>{showPastHistory ? '▲ Hide History' : '▼ View History'}</span>
                  </button>

                  {showPastHistory && (
                    <div className="mt-3 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {pastVisits.map(pv => (
                        <div key={pv.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span className="font-bold">Token #{pv.token_number} • {new Date(pv.arrival_time).toLocaleDateString()}</span>
                            <span className="capitalize">{pv.status}</span>
                          </div>
                          <div className="font-semibold text-slate-800">
                            <strong>Complaint:</strong> {pv.complaint}
                          </div>
                          {pv.diagnosis && (
                            <div className="text-emerald-800">
                              <strong>Diagnosis:</strong> {pv.diagnosis}
                            </div>
                          )}
                          {pv.prescription && (
                            <div className="text-slate-600 font-mono text-[11px] whitespace-pre-line">
                              <strong>Rx:</strong> {pv.prescription}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardTilt>

            {/* Diagnosis & Prescription Form with Auto-Save */}
            <CardTilt className="glass-card rounded-3xl p-6 sm:p-7 border border-white/90">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                      Physician Diagnosis & Treatment Order
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Auto-saves draft as you type • Required before closing case
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-400">
                  {isDraftSaving ? (
                    <span className="text-sky-600 font-semibold animate-pulse">Saving draft...</span>
                  ) : draftSavedAt ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Saved ({draftSavedAt})
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                {/* Diagnosis Textarea */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                    <span>Clinical Diagnosis *</span>
                    <span className="text-coral">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={diagnosis}
                    onChange={e => handleInputChange('diagnosis', e.target.value)}
                    placeholder="Enter clinical diagnosis (e.g. Acute Bronchitis, Essential Hypertension with angina symptoms)..."
                    className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-sky-500"
                    required
                  />
                </div>

                {/* Prescription Textarea */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <span className="text-base font-serif font-black">℞</span>
                    <span>Prescribed Medications & Dosage:</span>
                  </label>
                  <textarea
                    rows={3}
                    value={prescription}
                    onChange={e => handleInputChange('prescription', e.target.value)}
                    placeholder="1. Tab Paracetamol 650mg TDS x 3 days&#10;2. Tab Amoxicillin 500mg TDS after food x 5 days&#10;3. Cough Expectorant Syrup 10ml TDS..."
                    className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>

                {/* Follow Up */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Follow-Up & Lifestyle Advice:
                  </label>
                  <input
                    type="text"
                    value={followUp}
                    onChange={e => handleInputChange('followUp', e.target.value)}
                    placeholder="e.g. Return to clinic in 3 days if fever persists; plenty of fluids & rest."
                    className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>

                {/* Close Case Action Button */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 font-medium">
                    {!diagnosis.trim() && (
                      <span className="text-amber-700 font-semibold">
                        ⚠️ Diagnosis must be filled to enable "Close Case"
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCloseConfirm(true)}
                    disabled={!diagnosis.trim() || isClosing}
                    className="px-8 py-3.5 rounded-full font-black text-sm tracking-wide text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-mint shadow-md shadow-emerald-500/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete & Close Case</span>
                  </button>
                </div>
              </div>
            </CardTilt>
          </div>

          {/* Right Column: Waiting Queue with the doctor's move and remove controls */}
          <div className="space-y-4">
            {waitingQueuePanel}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Close Case */}
      {showCloseConfirm && currentVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="glass-card rounded-3xl max-w-md w-full p-6 border border-white/90 shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
              Confirm Case Closure
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
              Are you sure you want to finalize consultation for <strong>Token #{currentVisit.token_number} - {currentVisit.patient_name}</strong>?
              This will mark the visit as completed, free Consulting Room #1, and generate a printable prescription pass.
            </p>

            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 text-xs space-y-1 mb-5">
              <strong className="text-sky-900 block">Saved Diagnosis:</strong>
              <p className="text-slate-800 font-medium italic">"{diagnosis}"</p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all"
              >
                Return to Case
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseCase}
                disabled={isClosing}
                className="px-6 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/25 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isClosing ? 'Closing Case...' : 'Yes, Complete Case'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Prescription Modal */}
      {printedVisit && (
        <PrintPrescriptionModal
          visit={printedVisit}
          onClose={() => setPrintedVisit(null)}
        />
      )}

      {/* End-of-Day Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="glass-card rounded-3xl max-w-md w-full p-6 sm:p-7 border border-white/95 shadow-2xl relative">
            <button
              onClick={() => setShowStatsModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  End-of-Day Clinical Analytics
                </h3>
                <p className="text-xs text-slate-500">
                  Performance metrics for today's consulting sessions
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Patients Seen</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {stats?.patientsSeen || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Wait</span>
                  <span className="text-2xl font-black text-sky-600 font-mono">
                    {stats?.avgWaitMinutes || 0}m
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Consult</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">
                    {stats?.avgConsultMinutes || 0}m
                  </span>
                </div>
              </div>

              {/* Emergency Level Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-black text-slate-700 block mb-2 uppercase text-[10px] tracking-wider">
                  Today's Patient Acuity Distribution:
                </span>
                <div className="space-y-1.5">
                  {(stats?.emergencyBreakdown || []).map(b => (
                    <div key={b.emergency_level} className="flex justify-between items-center">
                      <span className="capitalize font-bold text-slate-600">
                        {b.emergency_level} priority:
                      </span>
                      <span className="font-mono font-black text-slate-800">
                        {b.count} visits
                      </span>
                    </div>
                  ))}
                  {(!stats?.emergencyBreakdown || stats.emergencyBreakdown.length === 0) && (
                    <span className="text-slate-400">No visits recorded yet today.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
