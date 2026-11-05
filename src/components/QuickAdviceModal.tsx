import React, { useState } from 'react';
import { X, Send, Sparkles, PhoneCall, MessageSquare, CheckCircle, ShieldAlert } from 'lucide-react';
import { PatientRecord } from '../types';

interface QuickAdviceModalProps {
  patient: PatientRecord;
  onClose: () => void;
  onSubmitAdvice: (patientId: string, adviceText: string) => void;
}

export const QuickAdviceModal: React.FC<QuickAdviceModalProps> = ({
  patient,
  onClose,
  onSubmitAdvice,
}) => {
  const isEmergency = patient.result.riskLevel === 'emergency';
  const isUrgent = patient.result.riskLevel === 'urgent';

  const defaultPresets = isEmergency
    ? [
        "108 Ambulance mobilized. Administer high flow O2 and keep patient in semi-Fowler position.",
        "Prepare IV line with normal saline. Immediate transfer to District Trauma & ICU unit.",
        "Keep airway clear. Administer aspirin 300mg chewable if no bleeding contraindication.",
      ]
    : isUrgent
    ? [
        "Give Tab Paracetamol 500mg TDS, oral rehydration salts 1L/day, and review at CHC OPD today.",
        "Maternal checkup required: verify BP and fetal heart sounds at Primary Health Center by 4 PM.",
        "Start oral bronchodilator / antihistamine, isolate if fever rises, review in 24 hours.",
      ]
    : [
        "Safe for home recovery. Rest, adequate warm fluids, and steam inhalation.",
        "Continue routine nutrition. Village ASHA worker to check on Day 3.",
      ];

  const [selectedPreset, setSelectedPreset] = useState(defaultPresets[0]);
  const [customNote, setCustomNote] = useState('');
  const [teleCallSimulated, setTeleCallSimulated] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAdvice = customNote.trim() ? customNote.trim() : selectedPreset;
    onSubmitAdvice(patient.id, finalAdvice);
  };

  const handleSimulateCall = () => {
    setTeleCallSimulated(true);
    setTimeout(() => {
      setTeleCallSimulated(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="glass-card rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-white/90 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Physician Advice & Tele-Order
            </h3>
            <p className="text-xs text-slate-500">
              For {patient.name} ({patient.age}y) • {patient.refId}
            </p>
          </div>
        </div>

        {/* Warning Indicator */}
        <div className={`p-3 rounded-2xl text-xs font-semibold mb-4 flex items-center gap-2 ${
          isEmergency ? 'bg-coral/10 text-coral border border-coral/30' : isUrgent ? 'bg-amber/10 text-amber-900 border border-amber/30' : 'bg-mint/10 text-emerald-800 border border-mint/30'
        }`}>
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Clinical Acuity: {patient.result.badgeLabel}</span>
        </div>

        {/* Quick Presets */}
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            1-Click Clinical Directives:
          </label>
          <div className="space-y-2">
            {defaultPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset);
                  setCustomNote(preset);
                }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  selectedPreset === preset
                    ? 'bg-sky-50 text-sky-900 border-sky-300 ring-1 ring-sky-300'
                    : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Physician Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Custom Medical Advice / Prescription Note:
            </label>
            <textarea
              value={customNote || selectedPreset}
              onChange={e => setCustomNote(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all resize-none"
              placeholder="Add specific drug dosage or instruction for village ASHA worker..."
            />
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleSimulateCall}
              className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                teleCallSimulated
                  ? 'bg-emerald-500 text-white border-emerald-500 animate-pulse'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
              <span>{teleCallSimulated ? 'Calling Village Sub-Center...' : 'Direct Audio Call'}</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-500 via-sky-600 to-mint text-white text-xs font-black shadow-md shadow-sky-500/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Advice via SMS/Mesh</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
