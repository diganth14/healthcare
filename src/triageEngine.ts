import { ExistingCondition, PatientRecord, RiskLevel, RuralVitalsData, SymptomId, TriageResult, VitalsData } from './types';

export function evaluateTriage(params: {
  name: string;
  age: number;
  conditions: ExistingCondition[];
  symptoms: SymptomId[];
  hasDevices: boolean;
  vitals: VitalsData;
  ruralVitals: RuralVitalsData;
}): TriageResult {
  const { age, conditions, symptoms, hasDevices, vitals, ruralVitals } = params;

  let riskLevel: RiskLevel = 'routine';
  const whyReasons: string[] = [];
  const firstAidSteps: string[] = [];
  let summaryNote = '';
  let recommendedDepartment = 'Primary Health Sub-Center';

  const has = (symptom: SymptomId) => symptoms.includes(symptom);
  const hasCond = (c: ExistingCondition) => conditions.includes(c);

  // Check EMERGENCY conditions
  const isHypoxic = hasDevices && vitals.spo2 < 90;
  const isSevereTachycardia = hasDevices && vitals.heartRate > 130;
  const isSevereBradycardia = hasDevices && vitals.heartRate < 45;
  const isCriticalFever = hasDevices && vitals.temperature >= 39.5;
  const isPreeclampsiaRisk = hasCond('pregnancy') && has('severe_headache') && (hasCond('high_bp') || (hasDevices && vitals.heartRate > 100));
  const isCardiacRisk = has('chest_pain') && (has('shortness_of_breath') || age > 45 || hasCond('high_bp') || hasCond('diabetes'));
  const isRuralCritical = !hasDevices && ruralVitals.hardToBreathe && (ruralVitals.dizzyOrFaint || ruralVitals.burningHot);

  if (isHypoxic || isSevereTachycardia || isSevereBradycardia || isCriticalFever || isPreeclampsiaRisk || isCardiacRisk || isRuralCritical) {
    riskLevel = 'emergency';

    if (isHypoxic) {
      whyReasons.push(`Critically low Blood Oxygen saturation (${vitals.spo2}% SpO2), indicating severe hypoxia/respiratory failure.`);
    }
    if (isCardiacRisk) {
      whyReasons.push(`Acute chest distress combined with secondary risk factors (${age > 45 ? 'Age > 45' : ''} ${hasCond('high_bp') ? 'Hypertension' : ''} ${has('shortness_of_breath') ? 'Dyspnea' : ''}), suggesting acute coronary or cardiorespiratory event.`);
    }
    if (isPreeclampsiaRisk) {
      whyReasons.push(`Pregnancy with acute neurological headache and blood pressure complications (high preeclampsia risk).`);
    }
    if (isRuralCritical) {
      whyReasons.push(`Severe breathing distress compounded by high fever / fainting signs observed without equipment.`);
    }
    if (isCriticalFever) {
      whyReasons.push(`Dangerous hyperthermia (${vitals.temperature}°C) risking febrile seizures and organ strain.`);
    }
    if (isSevereTachycardia || isSevereBradycardia) {
      whyReasons.push(`Critical cardiac pulse rate (${vitals.heartRate} BPM) outside viable autonomous physiological range.`);
    }

    firstAidSteps.push("Keep patient seated upright (Fowler's position) to ease lung expansion. Loosen tight neck and waist clothing.");
    firstAidSteps.push("If supplemental oxygen concentrator is available in village clinic, initiate low flow (2-4 L/min) immediately.");
    firstAidSteps.push("Dispatch 108 Emergency Ambulance or arrange immediate village emergency transport to District Hospital.");

    summaryNote = "Critical physiological instability detected. Requires immediate physician intervention and hospitalization.";
    recommendedDepartment = "District Hospital Emergency Room (ICU)";
  } 
  // Check URGENT conditions
  else {
    const isModerateHypoxia = hasDevices && vitals.spo2 >= 90 && vitals.spo2 < 94;
    const isHighFever = hasDevices && vitals.temperature >= 38.3 && vitals.temperature < 39.5;
    const isModerateTachycardia = hasDevices && vitals.heartRate >= 105 && vitals.heartRate <= 130;
    const isRuralHardBreathe = !hasDevices && ruralVitals.hardToBreathe;
    const isRuralHighFever = !hasDevices && ruralVitals.burningHot;
    const isSignificantSymptom = has('shortness_of_breath') || has('high_fever') || (has('dizziness') && (hasCond('diabetes') || hasCond('high_bp')));

    if (isModerateHypoxia || isHighFever || isModerateTachycardia || isRuralHardBreathe || isRuralHighFever || isSignificantSymptom || has('chest_pain')) {
      riskLevel = 'urgent';

      if (isModerateHypoxia) {
        whyReasons.push(`Sub-optimal oxygen saturation (${vitals.spo2}% SpO2) indicating progressive pulmonary congestion.`);
      }
      if (isHighFever || isRuralHighFever) {
        whyReasons.push(`Active febrile state (${hasDevices ? vitals.temperature + '°C' : 'Very hot skin'}) requiring investigation for malaria, dengue, or acute infection.`);
      }
      if (has('shortness_of_breath')) {
        whyReasons.push(`Persistent breathlessness without immediate cardiovascular shock.`);
      }
      if (has('dizziness') && (hasCond('diabetes') || hasCond('high_bp'))) {
        whyReasons.push(`Dizziness compounded by pre-existing metabolic/cardiovascular conditions (risk of hypoglycemia or pressure spike).`);
      }
      if (whyReasons.length === 0) {
        whyReasons.push("Multiple moderate clinical indicators require timely physician examination within 12-24 hours.");
      }

      firstAidSteps.push("Administer oral rehydration salts (ORS) or cool boiled water in frequent small sips.");
      firstAidSteps.push("Apply lukewarm wet cloth compresses on forehead and neck to lower temperature safely.");
      firstAidSteps.push("Schedule transportation to nearest Community Health Center (CHC) for same-day lab work and doctor review.");

      summaryNote = "Prompt clinical evaluation required today. Manage symptoms with supportive clinic care while en route.";
      recommendedDepartment = "Community Health Center (CHC) OPD";
    } 
    // Check ROUTINE conditions
    else {
      riskLevel = 'routine';
      whyReasons.push("Vital parameters and oxygen levels are within safe, stable physiological ranges.");
      whyReasons.push("No alarming respiratory, neurological, or cardiovascular red flags identified.");

      firstAidSteps.push("Ensure adequate rest, hydration (warm broths or fluids), and light nutritious food.");
      firstAidSteps.push("Monitor symptoms for 48 hours; return immediately if breathing difficulty or high fever develops.");
      firstAidSteps.push("Follow routine village ASHA worker home visit schedule for checkup follow-up.");

      summaryNote = "Safe for supportive home monitoring and local sub-center guidance. No emergency transfer required.";
      recommendedDepartment = "Primary Health Sub-Center / Home Care";
    }
  }

  // Generate Referral ID
  const randomRefNum = Math.floor(100 + Math.random() * 900);
  const referralId = `#REF-${randomRefNum}`;

  const badgeLabels = {
    routine: 'ROUTINE - HOME CARE',
    urgent: 'URGENT - SEE DOCTOR TODAY',
    emergency: 'EMERGENCY - IMMEDIATE HOSPITAL',
  };

  const badgeSubs = {
    routine: 'Safe for home recovery & community health check',
    urgent: 'Requires doctor review at Community Health Center today',
    emergency: 'Life-critical status • Immediate emergency referral',
  };

  const badgeColors: Record<RiskLevel, 'mint' | 'amber' | 'coral'> = {
    routine: 'mint',
    urgent: 'amber',
    emergency: 'coral',
  };

  // Compute continuous Clinical Acuity Severity Score (0 to 100)
  let severityScore = 15;
  if (riskLevel === 'emergency') {
    let score = 78;
    if (hasDevices) {
      if (vitals.spo2 < 90) score += Math.min(14, (90 - vitals.spo2) * 2);
      if (vitals.heartRate > 120) score += Math.min(6, (vitals.heartRate - 120) * 0.3);
      if (vitals.temperature >= 39.5) score += 5;
    } else {
      if (ruralVitals.hardToBreathe && ruralVitals.dizzyOrFaint) score += 14;
    }
    if (has('chest_pain')) score += 5;
    if (hasCond('high_bp') || hasCond('diabetes')) score += 3;
    severityScore = Math.min(99, Math.round(score));
  } else if (riskLevel === 'urgent') {
    let score = 48;
    if (hasDevices) {
      if (vitals.spo2 < 95) score += (95 - vitals.spo2) * 2;
      if (vitals.temperature >= 38.3) score += Math.min(8, (vitals.temperature - 38.0) * 7);
      if (vitals.heartRate > 100) score += Math.min(6, (vitals.heartRate - 100) * 0.3);
    } else {
      if (ruralVitals.burningHot) score += 8;
      if (ruralVitals.dizzyOrFaint) score += 6;
    }
    if (hasCond('pregnancy')) score += 6;
    severityScore = Math.min(69, Math.max(40, Math.round(score)));
  } else {
    // Routine: 5 to 35 (mildest at the bottom)
    let score = 10;
    score += symptoms.length * 3;
    if (age > 65 || age < 5) score += 4;
    severityScore = Math.min(35, Math.max(5, Math.round(score)));
  }

  return {
    riskLevel,
    badgeLabel: badgeLabels[riskLevel],
    badgeSub: badgeSubs[riskLevel],
    badgeColor: badgeColors[riskLevel],
    severityScore,
    whyReasons: whyReasons.slice(0, 3),
    firstAidSteps: firstAidSteps.slice(0, 3),
    summaryNote,
    recommendedDepartment,
    referralId,
    assessedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

// Initial mock patients for Doctor Queue tab
export const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: 'demo-1',
    refId: '#REF-892',
    name: 'Devappa Nayak',
    age: 58,
    gender: 'Male',
    conditions: ['high_bp'],
    symptoms: ['chest_pain', 'shortness_of_breath'],
    hasDevices: true,
    vitals: { spo2: 88, heartRate: 118, temperature: 37.1 },
    ruralVitals: { hardToBreathe: true, burningHot: false, dizzyOrFaint: true },
    result: {
      riskLevel: 'emergency',
      badgeLabel: 'EMERGENCY - IMMEDIATE HOSPITAL',
      badgeSub: 'Life-critical status • Immediate emergency referral',
      badgeColor: 'coral',
      severityScore: 94,
      whyReasons: [
        'Critically low Blood Oxygen saturation (88% SpO2), indicating acute hypoxia.',
        'Acute chest pain with dyspnea in hypertensive 58-year-old patient.',
        'High risk of Acute Coronary Syndrome / Myocardial Infarction.',
      ],
      firstAidSteps: [
        'Keep patient seated upright to ease breathing. Loosen collar.',
        'Start low flow oxygen (2-4 L/min) if cylinder available.',
        '108 Ambulance dispatched to Shirur Village Sub-Center.',
      ],
      summaryNote: 'Immediate emergency transport required.',
      recommendedDepartment: 'District Hospital Emergency Room (ICU)',
      referralId: '#REF-892',
      assessedAt: '14:20',
    },
    queueStatus: 'waiting',
    timestamp: Date.now() - 1000 * 60 * 18,
    location: 'Shirur Village (Zone 3)',
  },
  {
    id: 'demo-2',
    refId: '#REF-415',
    name: 'Lakshmi Bai',
    age: 26,
    gender: 'Female',
    conditions: ['pregnancy'],
    symptoms: ['high_fever', 'severe_headache'],
    hasDevices: false,
    vitals: { spo2: 95, heartRate: 98, temperature: 38.9 },
    ruralVitals: { hardToBreathe: false, burningHot: true, dizzyOrFaint: true },
    result: {
      riskLevel: 'urgent',
      badgeLabel: 'URGENT - SEE DOCTOR TODAY',
      badgeSub: 'Requires doctor review at Community Health Center today',
      badgeColor: 'amber',
      severityScore: 58,
      whyReasons: [
        'Pregnancy trimester 3 with high fever (burning hot forehead) & persistent headache.',
        'Suspected acute maternal infection / pre-eclamptic signs requiring blood pressure profiling.',
      ],
      firstAidSteps: [
        'Encourage oral hydration with fresh tender coconut water and ORS.',
        'Lukewarm sponging to moderate body temperature.',
        'Transfer to Taluk General Hospital for obstetric evaluation.',
      ],
      summaryNote: 'Urgent maternal evaluation necessary within 4 hours.',
      recommendedDepartment: 'Community Health Center (CHC) Maternity OPD',
      referralId: '#REF-415',
      assessedAt: '14:45',
    },
    queueStatus: 'waiting',
    timestamp: Date.now() - 1000 * 60 * 35,
    location: 'Hunasagi Sub-Center',
  },
  {
    id: 'demo-3',
    refId: '#REF-109',
    name: 'Basavaraj Patil',
    age: 34,
    gender: 'Male',
    conditions: [],
    symptoms: ['cough'],
    hasDevices: true,
    vitals: { spo2: 98, heartRate: 72, temperature: 36.8 },
    ruralVitals: { hardToBreathe: false, burningHot: false, dizzyOrFaint: false },
    result: {
      riskLevel: 'routine',
      badgeLabel: 'ROUTINE - HOME CARE',
      badgeSub: 'Safe for home recovery & community health check',
      badgeColor: 'mint',
      severityScore: 16,
      whyReasons: [
        'Normal oxygen saturation (98% SpO2) and calm resting pulse (72 BPM).',
        'No alarming chest distress, red flags, or severe systemic indicators.',
      ],
      firstAidSteps: [
        'Warm salt water gargles 3 times a day and steam inhalation.',
        'Stay well hydrated with warm ginger-tulsi tea or warm water.',
        'Rest at home; check back if fever develops over next 48 hours.',
      ],
      summaryNote: 'Mild seasonal upper respiratory symptoms. Managed at home.',
      recommendedDepartment: 'Primary Health Sub-Center / Home Care',
      referralId: '#REF-109',
      assessedAt: '15:02',
    },
    queueStatus: 'advice_sent',
    doctorAdvice: 'Take warm fluids. ASHA worker to check on Day 3.',
    timestamp: Date.now() - 1000 * 60 * 65,
    location: 'Muddebihal Clinic',
  },
];
