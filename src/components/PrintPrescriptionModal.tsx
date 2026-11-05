import React from 'react';
import { X, Printer, Stethoscope, CheckCircle2, Shield, Calendar, Clock, MapPin } from 'lucide-react';
import { Visit } from '../types';

interface PrintPrescriptionModalProps {
  visit: Visit;
  onClose: () => void;
}

export const PrintPrescriptionModal: React.FC<PrintPrescriptionModalProps> = ({ visit, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white animate-fade-in">
      <div className="glass-card rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-white/95 shadow-2xl relative bg-white my-6 print:m-0 print:border-none print:shadow-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Case Completed • Printable Visit Summary & Prescription
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-sky-500/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Prescription</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Prescription Content */}
        <div className="space-y-6 text-slate-800">
          {/* Clinic Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  COMMUNITY HEALTH CLINIC
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Primary Healthcare, Family Practice & Acute Triage Center
                </p>
                <p className="text-[11px] text-slate-400">
                  Tel: +91 80 2345 6789 • OPD Consulting Room #1
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-mono font-extrabold text-sm block mb-1">
                Token #{visit.token_number}
              </span>
              <span className="text-xs text-slate-500 font-semibold block">{formattedDate}</span>
              <span className="text-[11px] text-slate-400 font-mono">Visit ID: #{visit.id}</span>
            </div>
          </div>

          {/* Patient Profile & Demographics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
              <span className="font-extrabold text-sm text-slate-900">{visit.patient_name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Age / Gender</span>
              <span className="font-extrabold text-slate-900">{visit.patient_age} yrs • {visit.patient_gender}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone</span>
              <span className="font-semibold text-slate-800">{visit.patient_phone || 'None Provided'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Attending Doctor</span>
              <span className="font-extrabold text-slate-900">{visit.doctor_name || 'Dr. Arjun Smith'}</span>
            </div>
          </div>

          {/* Recorded Vitals */}
          <div className="p-3.5 rounded-2xl border border-slate-200 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">SpO2</span>
              <span className="font-mono font-black text-sm text-slate-800">
                {visit.vitals_spo2 ? `${visit.vitals_spo2}%` : '—'}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Heart Rate</span>
              <span className="font-mono font-black text-sm text-slate-800">
                {visit.vitals_heart_rate ? `${visit.vitals_heart_rate} bpm` : '—'}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Temp</span>
              <span className="font-mono font-black text-sm text-slate-800">
                {visit.vitals_temperature ? `${visit.vitals_temperature}°C` : '—'}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Blood Pressure</span>
              <span className="font-mono font-black text-sm text-slate-800">
                {visit.vitals_bp_systolic && visit.vitals_bp_diastolic 
                  ? `${visit.vitals_bp_systolic}/${visit.vitals_bp_diastolic} mmHg`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
              Chief Complaint & Symptoms:
            </span>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800">
              {visit.complaint} {visit.pain_level ? `(Pain scale: ${visit.pain_level}/10)` : ''}
            </div>
          </div>

          {/* Diagnosis */}
          <div className="border-t border-slate-200 pt-3">
            <span className="text-xs font-black uppercase tracking-wider text-sky-800 block mb-1.5 flex items-center gap-1.5">
              <span>Clinical Diagnosis</span>
            </span>
            <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 text-sm font-bold text-slate-900">
              {visit.diagnosis || 'Clinical evaluation completed.'}
            </div>
          </div>

          {/* Rx Prescription */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-serif font-black text-slate-900">℞</span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                Prescribed Treatment & Medications:
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 font-mono text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed min-h-[90px]">
              {visit.prescription || 'No oral prescription required. Continue supportive rest and hydration.'}
            </div>
          </div>

          {/* Follow-up & Advice */}
          {visit.follow_up && (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 font-medium">
              <span className="font-black block mb-0.5">Follow-Up Instructions:</span>
              {visit.follow_up}
            </div>
          )}

          {/* Doctor Signature Block */}
          <div className="pt-8 border-t border-slate-300 flex justify-between items-end">
            <div className="text-[11px] text-slate-400 font-medium">
              Consultation completed at {visit.consultation_end_time ? new Date(visit.consultation_end_time).toLocaleTimeString() : new Date().toLocaleTimeString()}
              <br />
              Electronic record verified • MediTrack
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-slate-800 mb-1" />
              <span className="text-xs font-extrabold text-slate-900 block">
                {visit.doctor_name || 'Dr. Arjun Smith'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Registered Medical Officer (Reg #KMC-48192)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
