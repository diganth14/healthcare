export type Language = 'en' | 'hi' | 'kn';

export type UserRole = 'doctor' | 'nurse';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  created_at?: string;
}

export type EmergencyLevel = 'emergency' | 'urgent' | 'normal';
export type RiskLevel = 'routine' | 'urgent' | 'emergency';

export type VisitStatus = 'waiting' | 'in_consultation' | 'completed' | 'cancelled';

export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  conditions: string[];
  created_at?: string;
  updated_at?: string;
  total_visits?: number;
  last_visit_date?: string;
}

export interface Visit {
  id: number;
  token_number: number;
  patient_id: number;
  created_by?: number;
  doctor_id?: number;
  arrival_time: string;
  vitals_spo2?: number;
  vitals_heart_rate?: number;
  vitals_temperature?: number;
  vitals_bp_systolic?: number;
  vitals_bp_diastolic?: number;
  complaint: string;
  pain_level: number;
  symptom_tags: string[];
  nurse_notes?: string;
  emergency_level: EmergencyLevel;
  status: VisitStatus;
  diagnosis?: string;
  prescription?: string;
  follow_up?: string;
  consultation_start_time?: string;
  consultation_end_time?: string;
  created_at?: string;
  updated_at?: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_phone?: string;
  patient_conditions: string[];
  doctor_name?: string;
  nurse_name?: string;
}

export interface QueueResponse {
  inConsultation: Visit | null;
  waitingQueue: Visit[];
  counts: {
    totalWaiting: number;
    emergencyCount: number;
    urgentCount: number;
    normalCount: number;
  };
}

export interface StatsResponse {
  patientsSeen: number;
  avgWaitMinutes: number;
  avgConsultMinutes: number;
  emergencyBreakdown: {
    emergency_level: EmergencyLevel;
    count: number;
  }[];
}

export interface EmergencyAlertData {
  visitId: number;
  token_number: number;
  patient_name: string;
  complaint: string;
  emergency_level: EmergencyLevel;
  arrival_time: string;
}

// Legacy & UI component compatibility types
export type ExistingCondition = 'diabetes' | 'high_bp' | 'pregnancy';

export type SymptomId = 
  | 'chest_pain'
  | 'shortness_of_breath'
  | 'high_fever'
  | 'severe_headache'
  | 'dizziness'
  | 'cough';

export interface VitalsData {
  spo2: number;
  heartRate: number;
  temperature: number;
}

export interface RuralVitalsData {
  hardToBreathe: boolean | null;
  burningHot: boolean | null;
  dizzyOrFaint: boolean | null;
}

export interface TriageResult {
  riskLevel: RiskLevel;
  badgeLabel: string;
  badgeSub: string;
  badgeColor: 'mint' | 'amber' | 'coral';
  severityScore: number;
  whyReasons: string[];
  firstAidSteps: string[];
  summaryNote: string;
  recommendedDepartment: string;
  referralId: string;
  assessedAt: string;
}

export interface PatientRecord {
  id: string;
  refId: string;
  name: string;
  age: number;
  gender?: string;
  conditions: ExistingCondition[];
  symptoms: SymptomId[];
  hasDevices: boolean;
  vitals: VitalsData;
  ruralVitals: RuralVitalsData;
  voiceNote?: string;
  result: TriageResult;
  queueStatus: 'waiting' | 'in_review' | 'advice_sent';
  doctorAdvice?: string;
  timestamp: number;
  location?: string;
}
