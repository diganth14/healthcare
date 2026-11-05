import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, 
  Search, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Heart, 
  Activity, 
  Droplets, 
  Sparkles, 
  User, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Stethoscope, 
  ArrowRight,
  ShieldAlert,
  ListOrdered,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { CardTilt } from './CardTilt';
import { EditVisitModal } from './EditVisitModal';
import { CompletedListModal } from './CompletedListModal';
import { PrintPrescriptionModal } from './PrintPrescriptionModal';
import { EmergencyLevel, Patient, QueueResponse, User as UserType, Visit } from '../types';

interface NursePortalProps {
  currentUser: UserType;
  queueData: QueueResponse;
  onRefreshQueue: () => void;
}

export const NursePortal: React.FC<NursePortalProps> = ({
  currentUser,
  queueData,
  onRefreshQueue,
}) => {
  // Navigation inside nurse portal: 'register' | 'queue'
  const [activeSubTab, setActiveSubTab] = useState<'register' | 'queue'>('register');

  // Registration Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [complaint, setComplaint] = useState('');
  const [painLevel, setPainLevel] = useState<number>(3);
  const [symptomTags, setSymptomTags] = useState<string[]>([]);
  const [nurseNotes, setNurseNotes] = useState('');
  const [hasDevices, setHasDevices] = useState(true);

  // Vitals
  const [spo2, setSpo2] = useState<number>(97);
  const [heartRate, setHeartRate] = useState<number>(76);
  const [temperature, setTemperature] = useState<number>(37.0);
  const [bpSys, setBpSys] = useState<number>(120);
  const [bpDia, setBpDia] = useState<number>(80);

  // Emergency Level: Auto-suggested + Manual override
  const [manualEmergencyOverride, setManualEmergencyOverride] = useState<EmergencyLevel | null>(null);

  // Returning Patient Search & Auto-fill
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Modals
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [printingVisit, setPrintingVisit] = useState<Visit | null>(null);

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // 1. Auto-suggest Emergency Level based on vitals and symptoms
  const autoSuggestedEmergency = useMemo<EmergencyLevel>(() => {
    // Critical conditions -> Emergency (Red)
    if (
      spo2 < 90 ||
      heartRate > 130 ||
      heartRate < 45 ||
      temperature >= 39.5 ||
      bpSys >= 180 ||
      bpDia >= 115 ||
      symptomTags.includes('chest_pain') && (symptomTags.includes('shortness_of_breath') || age > 50) ||
      painLevel >= 9
    ) {
      return 'emergency';
    }

    // Elevated conditions -> Urgent (Orange)
    if (
      (spo2 >= 90 && spo2 < 95) ||
      (heartRate >= 105 && heartRate <= 130) ||
      (temperature >= 38.3 && temperature < 39.5) ||
      bpSys >= 140 ||
      bpDia >= 90 ||
      symptomTags.includes('shortness_of_breath') ||
      symptomTags.includes('high_fever') ||
      symptomTags.includes('severe_headache') ||
      (selectedConditions.includes('pregnancy') && (temperature >= 38.0 || bpSys >= 135)) ||
      painLevel >= 6
    ) {
      return 'urgent';
    }

    // Normal (Green)
    return 'normal';
  }, [spo2, heartRate, temperature, bpSys, bpDia, symptomTags, age, selectedConditions, painLevel]);

  // Current effective emergency level
  const effectiveEmergencyLevel: EmergencyLevel = manualEmergencyOverride || autoSuggestedEmergency;

  // 2. Returning patient live search debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchPatients(searchQuery.trim());
        setSearchResults(res.patients);
      } catch (err) {
        console.warn('Patient search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-fill patient details from search match
  const handleSelectPatient = (p: Patient) => {
    setSelectedPatientId(p.id);
    setName(p.name);
    setAge(p.age);
    setGender((p.gender as any) || 'Male');
    setPhone(p.phone || '');
    setSelectedConditions(p.conditions || []);
    setSearchResults([]);
    setSearchQuery('');
    setSuccessNotice(`Auto-filled returning patient: ${p.name} (${p.total_visits || 1} prior visits recorded).`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const clearSelectedPatient = () => {
    setSelectedPatientId(null);
    setName('');
    setAge(35);
    setGender('Male');
    setPhone('');
    setSelectedConditions([]);
  };

  const toggleCondition = (cond: string) => {
    setSelectedConditions(prev =>
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  };

  const toggleSymptom = (sym: string) => {
    setSymptomTags(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  // 3. Register Visit Submit
  const handleRegisterVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Patient name is required.');
      return;
    }
    if (!complaint.trim()) {
      setFormError('Chief complaint is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.registerVisit({
        patient_id: selectedPatientId,
        name: name.trim(),
        age,
        gender,
        phone: phone.trim() || null,
        conditions: selectedConditions,
        complaint: complaint.trim(),
        emergency_level: effectiveEmergencyLevel,
        vitals_spo2: hasDevices ? spo2 : null,
        vitals_heart_rate: hasDevices ? heartRate : null,
        vitals_temperature: hasDevices ? temperature : null,
        vitals_bp_systolic: hasDevices ? bpSys : null,
        vitals_bp_diastolic: hasDevices ? bpDia : null,
        pain_level: painLevel,
        symptom_tags: symptomTags,
        nurse_notes: nurseNotes.trim() || null,
      });

      // Clear form for next patient
      clearSelectedPatient();
      setComplaint('');
      setNurseNotes('');
      setSymptomTags([]);
      setManualEmergencyOverride(null);
      setPainLevel(3);

      setSuccessNotice(`Patient registered successfully! Token #${res.visit.token_number} assigned. Priority: ${res.visit.emergency_level.toUpperCase()}.`);
      setTimeout(() => setSuccessNotice(null), 5000);

      onRefreshQueue();
      setActiveSubTab('queue'); // Switch to queue to show new position
    } catch (err: any) {
      setFormError(err.message || 'Failed to register patient visit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Cancel Visit (No-show)
  const handleCancelVisit = async (visit: Visit) => {
    const confirm = window.confirm(`Cancel Token #${visit.token_number} (${visit.patient_name}) as no-show?`);
    if (!confirm) return;

    try {
      await api.cancelVisit(visit.id);
      onRefreshQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel visit.');
    }
  };

  // Quick preset helper for tests
  const applyPreset = (type: 'emergency' | 'urgent' | 'normal') => {
    if (type === 'emergency') {
      setName('Devappa Nayak');
      setAge(61);
      setGender('Male');
      setPhone('9876543210');
      setSelectedConditions(['high_bp', 'diabetes']);
      setComplaint('Crushing substernal chest pain radiating to left arm with acute dyspnea');
      setSymptomTags(['chest_pain', 'shortness_of_breath', 'dizziness']);
      setSpo2(87);
      setHeartRate(128);
      setTemperature(37.2);
      setBpSys(175);
      setBpDia(105);
      setPainLevel(9);
      setNurseNotes('Oxygen concentrator connected. Immediate doctor consultation required.');
      setManualEmergencyOverride('emergency');
    } else if (type === 'urgent') {
      setName('Lakshmi Bai');
      setAge(26);
      setGender('Female');
      setPhone('9845012345');
      setSelectedConditions(['pregnancy']);
      setComplaint('High grade spiking fever with shaking chills and intense headache');
      setSymptomTags(['high_fever', 'severe_headache']);
      setSpo2(95);
      setHeartRate(104);
      setTemperature(39.1);
      setBpSys(122);
      setBpDia(78);
      setPainLevel(7);
      setNurseNotes('Third trimester pregnancy with high temperature. Sponge bath given.');
      setManualEmergencyOverride('urgent');
    } else {
      setName('Basavaraj Patil');
      setAge(34);
      setGender('Male');
      setPhone('9900998877');
      setSelectedConditions([]);
      setComplaint('Mild seasonal dry cough and throat irritation for 2 days');
      setSymptomTags(['cough']);
      setSpo2(99);
      setHeartRate(72);
      setTemperature(36.7);
      setBpSys(118);
      setBpDia(76);
      setPainLevel(2);
      setNurseNotes('Vitals stable, clear chest, routine OPD checkup.');
      setManualEmergencyOverride('normal');
    }
  };

  const waitingList = queueData.waitingQueue || [];
  const inConsultation = queueData.inConsultation;

  // Next patient to enter doctor's room (top of waiting queue)
  const nextToEnter = waitingList.length > 0 ? waitingList[0] : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Sub-navigation bar inside Nurse Portal */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl glass-card border border-white/90">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('register')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all flex items-center gap-2 ${
              activeSubTab === 'register'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>1. Register New / Returning Patient</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('queue')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all flex items-center gap-2 relative ${
              activeSubTab === 'queue'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>2. Live Triage Queue</span>
            {waitingList.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                queueData.counts.emergencyCount > 0 ? 'bg-coral text-white animate-pulse' : 'bg-slate-200 text-slate-800'
              }`}>
                {waitingList.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCompletedModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all"
          >
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Today's Completed List</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900 font-bold shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ===================== SUBTAB 1: REGISTER PATIENT ===================== */}
      {activeSubTab === 'register' && (
        <div className="space-y-6">
          {/* Quick Demo Cases & Returning Patient Search */}
          <div className="glass-card rounded-3xl p-5 border border-sky-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Returning Patient Search Box */}
              <div className="relative flex-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  🔍 Returning Patient Auto-Fill (Search Name or Phone):
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Type name (e.g. Ramesh, Sunita) or phone number..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/90 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 shadow-inner"
                  />
                  {isSearching && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-sky-600 font-semibold animate-pulse">
                      Searching...
                    </span>
                  )}
                </div>

                {/* Dropdown Results */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 max-h-60 overflow-y-auto space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                      Matching Registered Patients (Click to Auto-Fill):
                    </span>
                    {searchResults.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full p-2.5 rounded-xl hover:bg-sky-50 text-left transition-all flex items-center justify-between group border border-transparent hover:border-sky-200"
                      >
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 group-hover:text-sky-700">
                            {p.name}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-2">
                            ({p.age}y, {p.gender}) • {p.phone || 'No Phone'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                          Auto-Fill &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Instant 1-Click Demo Scenarios */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Quick Demo Case Presets:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('emergency')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-coral/10 hover:bg-coral/20 text-coral border border-coral/30 transition-all flex items-center gap-1 shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-coral animate-ping" />
                    <span>Emergency (Red)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('urgent')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber/10 hover:bg-amber/20 text-amber-900 border border-amber/30 transition-all flex items-center gap-1 shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber" />
                    <span>Urgent (Orange)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('normal')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-mint/10 hover:bg-mint/20 text-emerald-800 border border-mint/30 transition-all flex items-center gap-1 shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-mint" />
                    <span>Normal (Green)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegisterVisit} className="space-y-6">
            {formError && (
              <div className="p-4 rounded-2xl bg-coral/10 border border-coral/30 text-xs font-bold text-coral flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* STEP A: Patient Profile & Demographics */}
            <CardTilt className="glass-card rounded-3xl p-6 sm:p-7">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-base border border-sky-100 shadow-inner">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Patient Demographics
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedPatientId ? `Linked to permanent patient record #${selectedPatientId}` : 'New patient registration'}
                    </p>
                  </div>
                </div>

                {selectedPatientId && (
                  <button
                    type="button"
                    onClick={clearSelectedPatient}
                    className="text-[11px] text-slate-500 font-bold hover:text-coral underline"
                  >
                    Clear Auto-Fill
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                {/* Age & Gender */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Age ({age} yrs)
                    </label>
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                      {age}y
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={age}
                    onChange={e => setAge(parseInt(e.target.value, 10))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500 mt-2"
                  />
                </div>

                {/* Gender & Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Gender & Phone
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value as any)}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Mobile Phone"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pre-conditions */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600 mr-2">Known Conditions:</span>
                {[
                  { id: 'diabetes', label: 'Diabetes', icon: Droplets },
                  { id: 'high_bp', label: 'High BP (Hypertension)', icon: Activity },
                  { id: 'pregnancy', label: 'Pregnancy', icon: Heart },
                ].map(({ id, label, icon: Icon }) => {
                  const isSel = selectedConditions.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleCondition(id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        isSel
                          ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                      {isSel && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </CardTilt>

            {/* STEP B: Vitals Assessment with Auto-Suggested Emergency Level */}
            <CardTilt className="glass-card rounded-3xl p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-base border border-sky-100 shadow-inner">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Vitals & Clinical Emergency Level
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Auto-calculates priority suggestion from vitals with nurse override
                    </p>
                  </div>
                </div>

                {/* Device toggle */}
                <button
                  type="button"
                  onClick={() => setHasDevices(!hasDevices)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
                >
                  {hasDevices ? '✓ Medical Devices Mode' : 'Rural Visual Mode'}
                </button>
              </div>

              {/* Vitals Sliders */}
              {hasDevices && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                  {/* SpO2 */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold uppercase text-slate-500">Oxygen (SpO2)</span>
                      <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-black ${
                        spo2 < 90 ? 'bg-coral/15 text-coral' : spo2 < 95 ? 'bg-amber/15 text-amber-900' : 'bg-mint/15 text-emerald-800'
                      }`}>
                        {spo2}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="75"
                      max="100"
                      value={spo2}
                      onChange={e => setSpo2(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                      <span className="text-coral">&lt;90% Crit</span>
                      <span>95%+ Safe</span>
                    </div>
                  </div>

                  {/* Heart Rate */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold uppercase text-slate-500">Pulse (BPM)</span>
                      <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-black ${
                        heartRate > 125 || heartRate < 45 ? 'bg-coral/15 text-coral' : heartRate > 100 ? 'bg-amber/15 text-amber-900' : 'bg-mint/15 text-emerald-800'
                      }`}>
                        {heartRate} bpm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="160"
                      value={heartRate}
                      onChange={e => setHeartRate(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                      <span>40 bpm</span>
                      <span>60-100 Normal</span>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold uppercase text-slate-500">Temp (°C)</span>
                      <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-black ${
                        temperature >= 39.5 ? 'bg-coral/15 text-coral' : temperature >= 38.3 ? 'bg-amber/15 text-amber-900' : 'bg-mint/15 text-emerald-800'
                      }`}>
                        {temperature.toFixed(1)}°C
                      </span>
                    </div>
                    <input
                      type="range"
                      min="35.0"
                      max="41.5"
                      step="0.1"
                      value={temperature}
                      onChange={e => setTemperature(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                      <span>36.5 Normal</span>
                      <span className="text-coral">39.5+ High</span>
                    </div>
                  </div>

                  {/* Blood Pressure */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold uppercase text-slate-500">BP (Systolic/Dia)</span>
                      <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-black ${
                        bpSys >= 160 || bpDia >= 105 ? 'bg-coral/15 text-coral' : bpSys >= 140 ? 'bg-amber/15 text-amber-900' : 'bg-mint/15 text-emerald-800'
                      }`}>
                        {bpSys}/{bpDia}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Sys"
                        value={bpSys}
                        onChange={e => setBpSys(parseInt(e.target.value, 10))}
                        className="w-1/2 p-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                      />
                      <input
                        type="number"
                        placeholder="Dia"
                        value={bpDia}
                        onChange={e => setBpDia(parseInt(e.target.value, 10))}
                        className="w-1/2 p-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Live Auto-Suggestion Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold text-slate-700">
                    Vitals Auto-Detection:
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wide ${
                    autoSuggestedEmergency === 'emergency'
                      ? 'bg-coral text-white shadow-xs'
                      : autoSuggestedEmergency === 'urgent'
                      ? 'bg-amber text-slate-900 shadow-xs'
                      : 'bg-mint text-white shadow-xs'
                  }`}>
                    {autoSuggestedEmergency} Priority
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {manualEmergencyOverride ? '(Nurse manually overrode priority below)' : '(Auto-assigned based on physiological vitals)'}
                </span>
              </div>

              {/* 3 Big Emergency Level Selector Buttons (Nurse Override) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Assigned Emergency Level (Tap to override):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Emergency */}
                  <button
                    type="button"
                    onClick={() => setManualEmergencyOverride('emergency')}
                    className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                      effectiveEmergencyLevel === 'emergency'
                        ? 'bg-coral text-white border-coral shadow-lg shadow-coral/25 scale-[1.01]'
                        : 'bg-white/80 hover:bg-coral/5 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5" />
                        <span className="font-black text-sm">Emergency (Red)</span>
                      </div>
                      {effectiveEmergencyLevel === 'emergency' && <Check className="w-4 h-4" />}
                    </div>
                    <span className={`text-[11px] font-medium ${effectiveEmergencyLevel === 'emergency' ? 'text-coral-100' : 'text-slate-400'}`}>
                      Immediate physician attention • Life/organ critical
                    </span>
                  </button>

                  {/* Urgent */}
                  <button
                    type="button"
                    onClick={() => setManualEmergencyOverride('urgent')}
                    className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                      effectiveEmergencyLevel === 'urgent'
                        ? 'bg-amber text-slate-900 border-amber shadow-lg shadow-amber/25 scale-[1.01]'
                        : 'bg-white/80 hover:bg-amber/5 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-black text-sm">Urgent (Orange)</span>
                      </div>
                      {effectiveEmergencyLevel === 'urgent' && <Check className="w-4 h-4" />}
                    </div>
                    <span className={`text-[11px] font-medium ${effectiveEmergencyLevel === 'urgent' ? 'text-amber-900' : 'text-slate-400'}`}>
                      See doctor promptly today • Acute distress/fever
                    </span>
                  </button>

                  {/* Normal */}
                  <button
                    type="button"
                    onClick={() => setManualEmergencyOverride('normal')}
                    className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                      effectiveEmergencyLevel === 'normal'
                        ? 'bg-mint text-white border-mint shadow-lg shadow-mint/25 scale-[1.01]'
                        : 'bg-white/80 hover:bg-mint/5 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-black text-sm">Normal (Green)</span>
                      </div>
                      {effectiveEmergencyLevel === 'normal' && <Check className="w-4 h-4" />}
                    </div>
                    <span className={`text-[11px] font-medium ${effectiveEmergencyLevel === 'normal' ? 'text-mint-100' : 'text-slate-400'}`}>
                      Standard outpatient queue • Stable routine case
                    </span>
                  </button>
                </div>
              </div>
            </CardTilt>

            {/* STEP C: Complaint, Pain Scale & Notes */}
            <CardTilt className="glass-card rounded-3xl p-6 sm:p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-base border border-sky-100 shadow-inner">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Clinical Complaint & Symptoms
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Nurse triage notes and patient subjective pain rating
                  </p>
                </div>
              </div>

              {/* Chief Complaint Input */}
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Chief Complaint *
                </label>
                <textarea
                  rows={2}
                  value={complaint}
                  onChange={e => setComplaint(e.target.value)}
                  placeholder="e.g. Sharp chest pain on exertion, productive cough with greenish sputum..."
                  className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* Pain Scale (0 to 10) */}
              <div className="mb-5 p-3.5 rounded-2xl bg-white border border-slate-200">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Patient Pain Scale (0 = None, 10 = Worst Agony)
                  </label>
                  <span className={`px-2.5 py-0.5 rounded-lg font-mono font-black text-xs ${
                    painLevel >= 8 ? 'bg-coral text-white' : painLevel >= 5 ? 'bg-amber text-slate-900' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {painLevel} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painLevel}
                  onChange={e => setPainLevel(parseInt(e.target.value, 10))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                  <span>0 - No Pain</span>
                  <span>5 - Moderate</span>
                  <span className="text-coral">10 - Severe Pain</span>
                </div>
              </div>

              {/* Symptom Tags */}
              <div className="mb-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Clinical Symptom Flags:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'chest_pain', label: 'Chest Pain' },
                    { id: 'shortness_of_breath', label: 'Shortness of Breath' },
                    { id: 'high_fever', label: 'High Fever' },
                    { id: 'severe_headache', label: 'Severe Headache' },
                    { id: 'dizziness', label: 'Dizziness / Faint' },
                    { id: 'cough', label: 'Persistent Cough' },
                  ].map(({ id, label }) => {
                    const isSel = symptomTags.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleSymptom(id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isSel
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nurse Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nurse Observation Notes (Optional):
                </label>
                <input
                  type="text"
                  value={nurseNotes}
                  onChange={e => setNurseNotes(e.target.value)}
                  placeholder="e.g. Patient arrived via auto-rickshaw, visibly pale, oxygen provided..."
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-sky-500"
                />
              </div>
            </CardTilt>

            {/* Submit Button */}
            <div className="pt-2 flex flex-col items-center justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-12 py-4 rounded-full text-base font-black tracking-wide text-white bg-gradient-to-r from-sky-500 via-sky-600 to-mint shadow-lg shadow-sky-500/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70"
              >
                <UserPlus className="w-5 h-5" />
                <span>{isSubmitting ? 'Registering Patient...' : 'Register Patient & Add to Doctor Queue'}</span>
              </button>
              <p className="text-center text-xs text-slate-400 font-semibold mt-2.5">
                Automatically issues daily sequential Token number and alerts consulting doctor via live WebSocket
              </p>
            </div>
          </form>
        </div>
      )}

      {/* ===================== SUBTAB 2: LIVE TRIAGE QUEUE ===================== */}
      {activeSubTab === 'queue' && (
        <div className="space-y-6">
          {/* Active "Currently In Consultation" Card */}
          {inConsultation ? (
            <CardTilt className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-50 via-white to-sky-50 border-2 border-sky-300 shadow-lg shadow-sky-500/10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-sky-800">
                    Currently Inside Consulting Room #1
                  </span>
                </div>
                <span className="px-3 py-1 rounded-xl bg-sky-600 text-white font-mono font-black text-xs">
                  Token #{inConsultation.token_number}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {inConsultation.patient_name} ({inConsultation.patient_age}y, {inConsultation.patient_gender})
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    <strong>Chief Complaint:</strong> {inConsultation.complaint}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block">Attending:</span>
                  <span className="font-extrabold text-slate-800">{inConsultation.doctor_name || 'Dr. Arjun Smith'}</span>
                </div>
              </div>
            </CardTilt>
          ) : (
            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200 text-center text-xs text-slate-500 font-semibold">
              Consulting Room is currently free. Doctor can call the next patient.
            </div>
          )}

          {/* Waiting Queue Header & High Priority Highlight */}
          <div className="glass-card rounded-3xl p-5 border border-white/90">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Patients Waiting for Doctor ({waitingList.length} total)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Sorted strictly by: Emergency (Red) ➔ Urgent (Orange) ➔ Normal (Green), then arrival time
                </p>
              </div>

              {/* Acuity counters */}
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-coral/15 text-coral border border-coral/30">
                  {queueData.counts.emergencyCount} Emergency
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber/15 text-amber-900 border border-amber/30">
                  {queueData.counts.urgentCount} Urgent
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-mint/15 text-emerald-800 border border-mint/30">
                  {queueData.counts.normalCount} Normal
                </span>
              </div>
            </div>

            {/* Next To Enter Room Highlight Banner */}
            {nextToEnter && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-transparent border border-sky-300 flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-600 text-white font-extrabold text-[10px] uppercase tracking-wider animate-pulse">
                    Next to Enter Room
                  </span>
                  <span className="font-mono font-black text-xs text-slate-800">
                    Token #{nextToEnter.token_number}
                  </span>
                  <span className="font-extrabold text-xs text-slate-900">
                    {nextToEnter.patient_name}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  Arrival: {new Date(nextToEnter.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}

            {/* Waiting Queue Cards */}
            {waitingList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                No patients currently waiting in queue.
              </div>
            ) : (
              <div className="space-y-3">
                {waitingList.map((visit, index) => {
                  const isEmerg = visit.emergency_level === 'emergency';
                  const isUrg = visit.emergency_level === 'urgent';
                  const isTop = index === 0;

                  return (
                    <div
                      key={visit.id}
                      className={`p-4 rounded-2xl transition-all border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                        isTop
                          ? 'bg-sky-50/60 border-sky-300 ring-1 ring-sky-300 shadow-sm'
                          : isEmerg
                          ? 'bg-coral/5 border-coral/30 hover:border-coral/50'
                          : isUrg
                          ? 'bg-amber/5 border-amber/30 hover:border-amber/50'
                          : 'bg-white/80 border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Token # */}
                          <span className="font-mono font-black px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs">
                            Token #{visit.token_number}
                          </span>

                          {/* Emergency Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            isEmerg
                              ? 'bg-coral text-white animate-pulse'
                              : isUrg
                              ? 'bg-amber text-slate-900'
                              : 'bg-mint text-white'
                          }`}>
                            {isEmerg && <Flame className="w-3 h-3" />}
                            {isUrg && <AlertTriangle className="w-3 h-3" />}
                            {visit.emergency_level}
                          </span>

                          {isTop && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800">
                              Next in Line
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3" />
                            Arrived {new Date(visit.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Patient Name */}
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900">
                            {visit.patient_name}
                          </span>
                          <span className="text-slate-400 font-mono text-xs">
                            ({visit.patient_age}y, {visit.patient_gender})
                          </span>
                          {visit.patient_phone && (
                            <span className="text-slate-500 font-mono text-xs">
                              • 📞 {visit.patient_phone}
                            </span>
                          )}
                        </div>

                        {/* Complaint & Vitals */}
                        <div className="text-slate-700 font-medium bg-white/70 p-2 rounded-xl border border-slate-100">
                          <strong>Complaint:</strong> {visit.complaint} {visit.pain_level ? `(Pain: ${visit.pain_level}/10)` : ''}
                        </div>

                        {/* Vitals pills */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] font-mono text-slate-600">
                          {visit.vitals_spo2 && (
                            <span className={`px-2 py-0.5 rounded-md ${visit.vitals_spo2 < 90 ? 'bg-coral/15 text-coral font-bold' : 'bg-slate-100'}`}>
                              SpO2: {visit.vitals_spo2}%
                            </span>
                          )}
                          {visit.vitals_heart_rate && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100">
                              HR: {visit.vitals_heart_rate} bpm
                            </span>
                          )}
                          {visit.vitals_temperature && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100">
                              Temp: {visit.vitals_temperature}°C
                            </span>
                          )}
                          {visit.vitals_bp_systolic && visit.vitals_bp_diastolic && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100">
                              BP: {visit.vitals_bp_systolic}/{visit.vitals_bp_diastolic}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions: Edit & Cancel (No-show) */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                        <button
                          type="button"
                          onClick={() => setEditingVisit(visit)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 shadow-xs flex items-center gap-1 transition-all"
                          title="Edit patient details or emergency level"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelVisit(visit)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-coral/10 text-coral font-bold border border-coral/30 shadow-xs flex items-center gap-1 transition-all"
                          title="Cancel no-show patient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>No-Show</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Visit Modal */}
      {editingVisit && (
        <EditVisitModal
          visit={editingVisit}
          onClose={() => setEditingVisit(null)}
          onSuccess={() => {
            onRefreshQueue();
            setSuccessNotice('Patient record updated successfully.');
            setTimeout(() => setSuccessNotice(null), 3000);
          }}
        />
      )}

      {/* Completed List Modal */}
      {showCompletedModal && (
        <CompletedListModal
          onClose={() => setShowCompletedModal(false)}
          onPrintVisit={(v) => setPrintingVisit(v)}
        />
      )}

      {/* Print Prescription Modal */}
      {printingVisit && (
        <PrintPrescriptionModal
          visit={printingVisit}
          onClose={() => setPrintingVisit(null)}
        />
      )}
    </div>
  );
};
