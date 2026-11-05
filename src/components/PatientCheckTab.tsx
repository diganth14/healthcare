import React, { useState } from 'react';
import { 
  HeartCrack, 
  Wind, 
  Thermometer, 
  Brain, 
  RotateCw, 
  Activity, 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle2, 
  User, 
  Stethoscope, 
  ShieldAlert, 
  Play,
  Heart,
  Droplets,
  Flame,
  Check,
  X
} from 'lucide-react';
import { CardTilt } from './CardTilt';
import { ExistingCondition, Language, RuralVitalsData, SymptomId, VitalsData } from '../types';
import { translations } from '../translations';

interface PatientCheckTabProps {
  language: Language;
  onRunTriage: (patientData: {
    name: string;
    age: number;
    conditions: ExistingCondition[];
    symptoms: SymptomId[];
    hasDevices: boolean;
    vitals: VitalsData;
    ruralVitals: RuralVitalsData;
    voiceNote?: string;
  }) => void;
  isAnalyzing: boolean;
}

export const PatientCheckTab: React.FC<PatientCheckTabProps> = ({
  language,
  onRunTriage,
  isAnalyzing,
}) => {
  const t = translations[language];

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(38);
  const [conditions, setConditions] = useState<ExistingCondition[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomId[]>([]);
  const [hasDevices, setHasDevices] = useState(true);

  // Vitals with devices
  const [vitals, setVitals] = useState<VitalsData>({
    spo2: 97,
    heartRate: 76,
    temperature: 37.0,
  });

  // Rural mode vitals (No devices)
  const [ruralVitals, setRuralVitals] = useState<RuralVitalsData>({
    hardToBreathe: null,
    burningHot: null,
    dizzyOrFaint: null,
  });

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');

  // 1-Click Demo Presets
  const applyPreset = (preset: 'healthy' | 'urgent' | 'emergency') => {
    if (preset === 'healthy') {
      setName('Kiran Gowda');
      setAge(32);
      setConditions([]);
      setSymptoms(['cough']);
      setHasDevices(true);
      setVitals({ spo2: 98, heartRate: 72, temperature: 36.9 });
      setRuralVitals({ hardToBreathe: false, burningHot: false, dizzyOrFaint: false });
      setTranscribedText('"Mild seasonal dry cough for 2 days, no fever or shortness of breath."');
    } else if (preset === 'urgent') {
      setName('Sunita Devi');
      setAge(29);
      setConditions(['pregnancy']);
      setSymptoms(['high_fever', 'severe_headache']);
      setHasDevices(true);
      setVitals({ spo2: 95, heartRate: 104, temperature: 38.8 });
      setRuralVitals({ hardToBreathe: false, burningHot: true, dizzyOrFaint: true });
      setTranscribedText('"High temperature with chills and headache since yesterday morning."');
    } else if (preset === 'emergency') {
      setName('Shankarappa Patil');
      setAge(61);
      setConditions(['high_bp', 'diabetes']);
      setSymptoms(['chest_pain', 'shortness_of_breath', 'dizziness']);
      setHasDevices(true);
      setVitals({ spo2: 87, heartRate: 134, temperature: 37.2 });
      setRuralVitals({ hardToBreathe: true, burningHot: false, dizzyOrFaint: true });
      setTranscribedText('"Crushing chest pressure radiating to left arm and gasping for air."');
    }
  };

  // Condition toggles
  const toggleCondition = (cond: ExistingCondition) => {
    setConditions(prev =>
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  };

  // Symptom toggles
  const toggleSymptom = (sym: SymptomId) => {
    setSymptoms(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  // Voice speech simulation & Web Speech API integration
  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setTranscribedText(`"${transcript}"`);
          setIsListening(false);

          // Auto-tag symptoms from voice
          const lower = transcript.toLowerCase();
          const newSymptoms = [...symptoms];
          if ((lower.includes('chest') || lower.includes('pain') || lower.includes('छाती')) && !newSymptoms.includes('chest_pain')) {
            newSymptoms.push('chest_pain');
          }
          if ((lower.includes('breath') || lower.includes('saans') || lower.includes('ಉಸಿರಾಟ')) && !newSymptoms.includes('shortness_of_breath')) {
            newSymptoms.push('shortness_of_breath');
          }
          if ((lower.includes('fever') || lower.includes('bukhar') || lower.includes('ಜ್ವರ')) && !newSymptoms.includes('high_fever')) {
            newSymptoms.push('high_fever');
          }
          if ((lower.includes('head') || lower.includes('sar dard') || lower.includes('ತಲೆನೋವು')) && !newSymptoms.includes('severe_headache')) {
            newSymptoms.push('severe_headache');
          }
          if ((lower.includes('dizzy') || lower.includes('chakkar') || lower.includes('ತಲೆಸುತ್ತು')) && !newSymptoms.includes('dizziness')) {
            newSymptoms.push('dizziness');
          }
          if ((lower.includes('cough') || lower.includes('khansi') || lower.includes('ಕೆಮ್ಮು')) && !newSymptoms.includes('cough')) {
            newSymptoms.push('cough');
          }
          setSymptoms(newSymptoms);
        };

        recognition.onerror = () => {
          setIsListening(false);
          // Fallback simulation for local/rural test
          fallbackVoiceSimulation();
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (err) {
        fallbackVoiceSimulation();
      }
    } else {
      fallbackVoiceSimulation();
    }
  };

  const fallbackVoiceSimulation = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const simulatedNotes = [
        '"Patient reports heavy fever, headache, and severe fatigue since morning."',
        '"Severe dry cough with chest tightness when walking uphill."',
        '"Feeling very dizzy and cold sweats, resting pulse is fast."',
      ];
      const randomNote = simulatedNotes[Math.floor(Math.random() * simulatedNotes.length)];
      setTranscribedText(randomNote);

      if (randomNote.includes('fever') && !symptoms.includes('high_fever')) {
        setSymptoms(prev => [...prev, 'high_fever']);
      }
      if (randomNote.includes('cough') && !symptoms.includes('cough')) {
        setSymptoms(prev => [...prev, 'cough']);
      }
      if (randomNote.includes('dizzy') && !symptoms.includes('dizziness')) {
        setSymptoms(prev => [...prev, 'dizziness']);
      }
    }, 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunTriage({
      name: name.trim() || 'Anonymous Patient',
      age,
      conditions,
      symptoms,
      hasDevices,
      vitals,
      ruralVitals,
      voiceNote: transcribedText,
    });
  };

  // Helper color indicators for vitals
  const getSpo2Color = (v: number) => {
    if (v >= 95) return 'text-mint bg-mint/10 border-mint/30';
    if (v >= 90) return 'text-amber bg-amber/10 border-amber/30';
    return 'text-coral bg-coral/10 border-coral/30';
  };

  const getBpmColor = (v: number) => {
    if (v >= 60 && v <= 100) return 'text-mint bg-mint/10 border-mint/30';
    if ((v > 100 && v <= 125) || (v >= 50 && v < 60)) return 'text-amber bg-amber/10 border-amber/30';
    return 'text-coral bg-coral/10 border-coral/30';
  };

  const getTempColor = (v: number) => {
    if (v <= 37.4) return 'text-mint bg-mint/10 border-mint/30';
    if (v < 38.6) return 'text-amber bg-amber/10 border-amber/30';
    return 'text-coral bg-coral/10 border-coral/30';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24">
      {/* 1-Click Demo Testing Ribbon */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 border border-sky-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-sky-600 fill-sky-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Instant Demo Scenarios:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset('healthy')}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-mint/10 text-emerald-800 border border-mint/30 hover:bg-mint/20 hover:scale-105 transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-mint"></span>
            {t.demoPresets.healthy}
          </button>
          <button
            type="button"
            onClick={() => applyPreset('urgent')}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber/10 text-amber-900 border border-amber/30 hover:bg-amber/20 hover:scale-105 transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-amber"></span>
            {t.demoPresets.urgentFever}
          </button>
          <button
            type="button"
            onClick={() => applyPreset('emergency')}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-coral/10 text-coral-800 border border-coral/30 hover:bg-coral/20 hover:scale-105 transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-coral animate-ping"></span>
            {t.demoPresets.emergency}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* STEP A: Patient Profile */}
        <CardTilt className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg border border-sky-100 shadow-inner">
              A
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {t.stepA.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {t.stepA.subtitle}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                {t.stepA.nameLabel}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t.stepA.namePlaceholder}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/90 border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 text-slate-800 text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Age Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {t.stepA.ageLabel}
                </label>
                <span className="px-3 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 font-extrabold text-sm font-mono">
                  {age} yrs
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={age}
                onChange={e => setAge(parseInt(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                <span>Infant (1)</span>
                <span>Adult (40)</span>
                <span>Elderly (100)</span>
              </div>
            </div>
          </div>

          {/* Existing Pre-Conditions */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              {t.stepA.conditionsLabel}
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'diabetes', label: t.stepA.diabetes, icon: Droplets },
                { id: 'high_bp', label: t.stepA.highBp, icon: Activity },
                { id: 'pregnancy', label: t.stepA.pregnancy, icon: Heart },
              ].map(({ id, label, icon: Icon }) => {
                const isSelected = conditions.includes(id as ExistingCondition);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleCondition(id as ExistingCondition)}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold transition-all border ${
                      isSelected
                        ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/25 scale-[1.02]'
                        : 'bg-white/80 text-slate-700 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-sky-500'}`} />
                    <span>{label}</span>
                    {isSelected && <Check className="w-4 h-4 ml-1 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </CardTilt>

        {/* STEP B: Symptoms */}
        <CardTilt className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg border border-sky-100 shadow-inner">
                B
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {t.stepB.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {t.stepB.subtitle}
                </p>
              </div>
            </div>

            {/* Speak Symptoms Mic Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs font-extrabold tracking-wide transition-all border ${
                isListening
                  ? 'bg-coral text-white border-coral shadow-lg shadow-coral/30 animate-pulse'
                  : 'bg-white text-sky-700 border-sky-200 hover:border-sky-300 hover:bg-sky-50 shadow-sm'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-white" />
                  <span>{t.stepB.listening}</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-sky-600" />
                  <span>{t.stepB.speakButton}</span>
                </>
              )}
            </button>
          </div>

          {/* Voice transcription display banner if present */}
          {transcribedText && (
            <div className="mb-6 p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5 text-xs text-sky-900 font-medium">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sky-700 block mb-0.5">{t.stepB.voiceDetected}</span>
                <span className="italic">{transcribedText}</span>
              </div>
            </div>
          )}

          {/* 6 Big Friendly Symptom Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {[
              { id: 'chest_pain', label: t.stepB.symptoms.chest_pain, icon: HeartCrack, desc: 'Tightness, radiating pressure' },
              { id: 'shortness_of_breath', label: t.stepB.symptoms.shortness_of_breath, icon: Wind, desc: 'Struggling, heavy gasping' },
              { id: 'high_fever', label: t.stepB.symptoms.high_fever, icon: Flame, desc: 'Hot forehead, shaking chills' },
              { id: 'severe_headache', label: t.stepB.symptoms.severe_headache, icon: Brain, desc: 'Throbbing, vision blur' },
              { id: 'dizziness', label: t.stepB.symptoms.dizziness, icon: RotateCw, desc: 'Lightheaded, fainting sensation' },
              { id: 'cough', label: t.stepB.symptoms.cough, icon: Activity, desc: 'Persistent phlegm or dry fit' },
            ].map(({ id, label, icon: Icon, desc }) => {
              const isSelected = symptoms.includes(id as SymptomId);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleSymptom(id as SymptomId)}
                  className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20 translate-y-[-2px]'
                      : 'bg-white/80 hover:bg-white text-slate-800 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-600 group-hover:scale-110'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {label}
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                      {desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardTilt>

        {/* STEP C: Vitals Assessment */}
        <CardTilt className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg border border-sky-100 shadow-inner">
                C
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {t.stepC.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {t.stepC.subtitle}
                </p>
              </div>
            </div>

            {/* Device Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
              <button
                type="button"
                onClick={() => setHasDevices(true)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  hasDevices
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.stepC.modeDevices}
              </button>
              <button
                type="button"
                onClick={() => setHasDevices(false)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  !hasDevices
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.stepC.modeRural}
              </button>
            </div>
          </div>

          {/* If Devices Available: 3 simple sliders with live color indicators */}
          {hasDevices ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* SpO2 Slider */}
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t.stepC.oxygenLabel}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg border font-mono font-bold text-xs ${getSpo2Color(vitals.spo2)}`}>
                    {vitals.spo2}%
                  </span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="100"
                  value={vitals.spo2}
                  onChange={e => setVitals({ ...vitals, spo2: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span className="text-coral font-bold">&lt;90% Danger</span>
                  <span className="text-amber font-bold">90-94% Urgent</span>
                  <span className="text-mint font-bold">&ge;95% Safe</span>
                </div>
              </div>

              {/* Heart Rate Slider */}
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t.stepC.heartRateLabel}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg border font-mono font-bold text-xs ${getBpmColor(vitals.heartRate)}`}>
                    {vitals.heartRate} BPM
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={vitals.heartRate}
                  onChange={e => setVitals({ ...vitals, heartRate: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Slow (40)</span>
                  <span className="text-mint font-bold">60-100 Normal</span>
                  <span>Fast (160)</span>
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t.stepC.tempLabel}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg border font-mono font-bold text-xs ${getTempColor(vitals.temperature)}`}>
                    {vitals.temperature.toFixed(1)}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="35.0"
                  max="41.5"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={e => setVitals({ ...vitals, temperature: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>35°C</span>
                  <span className="text-mint font-bold">36.5 - 37.2°C</span>
                  <span>41.5°C</span>
                </div>
              </div>
            </div>
          ) : (
            /* If No Devices (Rural Mode): 3 simple Yes/No questions */
            <div className="space-y-3.5">
              {[
                {
                  id: 'hardToBreathe',
                  question: t.stepC.ruralQuestions.hardToBreathe,
                  value: ruralVitals.hardToBreathe,
                  setter: (val: boolean) => setRuralVitals({ ...ruralVitals, hardToBreathe: val }),
                },
                {
                  id: 'burningHot',
                  question: t.stepC.ruralQuestions.burningHot,
                  value: ruralVitals.burningHot,
                  setter: (val: boolean) => setRuralVitals({ ...ruralVitals, burningHot: val }),
                },
                {
                  id: 'dizzyOrFaint',
                  question: t.stepC.ruralQuestions.dizzyOrFaint,
                  value: ruralVitals.dizzyOrFaint,
                  setter: (val: boolean) => setRuralVitals({ ...ruralVitals, dizzyOrFaint: val }),
                },
              ].map(({ id, question, value, setter }) => (
                <div
                  key={id}
                  className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4"
                >
                  <span className="text-sm font-semibold text-slate-800 max-w-md">
                    {question}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setter(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        value === true
                          ? 'bg-coral text-white border-coral shadow-sm shadow-coral/25'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t.stepC.ruralQuestions.yes}
                    </button>
                    <button
                      type="button"
                      onClick={() => setter(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        value === false
                          ? 'bg-mint text-white border-mint shadow-sm shadow-mint/25'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      {t.stepC.ruralQuestions.no}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardTilt>

        {/* Big Glowing Blue-Green Action Button */}
        <div className="pt-2 flex flex-col items-center justify-center">
          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full sm:w-auto px-10 py-5 rounded-full text-base sm:text-lg font-black tracking-wide text-white bg-gradient-to-r from-sky-500 via-sky-600 to-mint shadow-[0_12px_40px_rgba(14,165,233,0.35)] hover:shadow-[0_16px_50px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-75 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RotateCw className="w-5 h-5 animate-spin" />
                <span>{t.analyzingTriage}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{t.runTriageBtn}</span>
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-500 font-semibold mt-3">
            ⚡ Patient will be automatically sorted into the Doctor Queue: Critical emergencies first, mild problems last
          </p>
        </div>
      </form>
    </div>
  );
};
