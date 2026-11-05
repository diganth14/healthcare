import React, { useState } from 'react';
import { X, Save, AlertTriangle, Flame, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../api';
import { EmergencyLevel, Visit } from '../types';

interface EditVisitModalProps {
  visit: Visit;
  onClose: () => void;
  onSuccess: (updated: Visit) => void;
}

export const EditVisitModal: React.FC<EditVisitModalProps> = ({ visit, onClose, onSuccess }) => {
  const [name, setName] = useState(visit.patient_name);
  const [age, setAge] = useState<number>(visit.patient_age);
  const [phone, setPhone] = useState(visit.patient_phone || '');
  const [complaint, setComplaint] = useState(visit.complaint);
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>(visit.emergency_level);
  const [spo2, setSpo2] = useState(visit.vitals_spo2 ? String(visit.vitals_spo2) : '');
  const [heartRate, setHeartRate] = useState(visit.vitals_heart_rate ? String(visit.vitals_heart_rate) : '');
  const [temperature, setTemperature] = useState(visit.vitals_temperature ? String(visit.vitals_temperature) : '');
  const [bpSys, setBpSys] = useState(visit.vitals_bp_systolic ? String(visit.vitals_bp_systolic) : '');
  const [bpDia, setBpDia] = useState(visit.vitals_bp_diastolic ? String(visit.vitals_bp_diastolic) : '');
  const [painLevel, setPainLevel] = useState<number>(visit.pain_level || 0);
  const [nurseNotes, setNurseNotes] = useState(visit.nurse_notes || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.editVisit(visit.id, {
        name,
        age,
        phone,
        complaint,
        emergency_level: emergencyLevel,
        vitals_spo2: spo2 ? Number(spo2) : null,
        vitals_heart_rate: heartRate ? parseInt(heartRate, 10) : null,
        vitals_temperature: temperature ? Number(temperature) : null,
        vitals_bp_systolic: bpSys ? parseInt(bpSys, 10) : null,
        vitals_bp_diastolic: bpDia ? parseInt(bpDia, 10) : null,
        pain_level: painLevel,
        nurse_notes: nurseNotes,
      });

      onSuccess(res.visit);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update visit.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="glass-card rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-white/95 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <span className="text-[11px] font-mono font-extrabold uppercase text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">
            Token #{visit.token_number}
          </span>
          <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Edit Patient & Triage Details
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Update vitals or modify priority level while patient is waiting
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/30 text-xs font-bold text-coral">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Emergency Priority Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Emergency Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEmergencyLevel('emergency')}
                className={`py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 border ${
                  emergencyLevel === 'emergency'
                    ? 'bg-coral text-white border-coral shadow-md shadow-coral/25'
                    : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-coral/10'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Emergency</span>
              </button>

              <button
                type="button"
                onClick={() => setEmergencyLevel('urgent')}
                className={`py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 border ${
                  emergencyLevel === 'urgent'
                    ? 'bg-amber text-slate-900 border-amber shadow-md shadow-amber/25'
                    : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-amber/10'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Urgent</span>
              </button>

              <button
                type="button"
                onClick={() => setEmergencyLevel('normal')}
                className={`py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 border ${
                  emergencyLevel === 'normal'
                    ? 'bg-mint text-white border-mint shadow-md shadow-mint/25'
                    : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-mint/10'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Normal</span>
              </button>
            </div>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Patient Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Age (Years)</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(parseInt(e.target.value, 10))}
                className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          {/* Vitals Row */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Recorded Vitals</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">SpO2 (%)</span>
                <input
                  type="number"
                  placeholder="e.g. 98"
                  value={spo2}
                  onChange={e => setSpo2(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">HR (BPM)</span>
                <input
                  type="number"
                  placeholder="e.g. 78"
                  value={heartRate}
                  onChange={e => setHeartRate(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">Temp (°C)</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 37.0"
                  value={temperature}
                  onChange={e => setTemperature(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Chief Complaint</label>
            <textarea
              rows={2}
              value={complaint}
              onChange={e => setComplaint(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 resize-none"
              required
            />
          </div>

          {/* Nurse Notes */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Nurse Notes & Observations</label>
            <textarea
              rows={2}
              value={nurseNotes}
              onChange={e => setNurseNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-sky-500 resize-none"
              placeholder="e.g. Oxygen initiated, cold sponge applied..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/25 disabled:opacity-70"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Saving Changes...' : 'Save Updates'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
