import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, Printer, User, Search, RefreshCw, FileText } from 'lucide-react';
import { api } from '../api';
import { Visit } from '../types';

interface CompletedListModalProps {
  onClose: () => void;
  onPrintVisit: (visit: Visit) => void;
}

export const CompletedListModal: React.FC<CompletedListModalProps> = ({ onClose, onPrintVisit }) => {
  const [completed, setCompleted] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadCompleted = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getCompletedToday();
      setCompleted(res.completed);
    } catch (err: any) {
      setError(err.message || 'Failed to load completed visits.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompleted();
  }, []);

  const filtered = completed.filter(v => 
    v.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    String(v.token_number).includes(search) ||
    (v.diagnosis && v.diagnosis.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="glass-card rounded-3xl max-w-2xl w-full p-6 sm:p-7 border border-white/95 shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Today's Completed Patient Visits
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                All patient consultations finished by the doctor today ({completed.length} total)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadCompleted}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"
              title="Refresh list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="py-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient name, token or diagnosis..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">
              Loading completed visits...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-coral/10 text-coral text-xs font-bold text-center">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              No completed visits match your search.
            </div>
          ) : (
            filtered.map(visit => (
              <div
                key={visit.id}
                className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs">
                      Token #{visit.token_number}
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {visit.patient_name}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      ({visit.patient_age}y, {visit.patient_gender})
                    </span>
                  </div>

                  <div className="text-slate-600 font-medium">
                    <strong className="text-slate-800">Diagnosis:</strong> {visit.diagnosis || 'None entered'}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Completed at {visit.consultation_end_time ? new Date(visit.consultation_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                    <span>• Doctor: {visit.doctor_name || 'Dr. Arjun Smith'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onPrintVisit(visit)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
                    title="Print prescription / visit pass"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-600" />
                    <span>Print Rx</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
