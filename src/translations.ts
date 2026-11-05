import { Language } from './types';

export interface TranslationDictionary {
  appName: string;
  appTagline: string;
  onlineMode: string;
  offlineMode: string;
  offlineNotice: string;
  tabs: {
    checkPatient: string;
    aiResult: string;
    doctorQueue: string;
  };
  demoPresets: {
    healthy: string;
    urgentFever: string;
    emergency: string;
  };
  stepA: {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    ageLabel: string;
    conditionsLabel: string;
    diabetes: string;
    highBp: string;
    pregnancy: string;
  };
  stepB: {
    title: string;
    subtitle: string;
    speakButton: string;
    listening: string;
    voiceDetected: string;
    symptoms: {
      chest_pain: string;
      shortness_of_breath: string;
      high_fever: string;
      severe_headache: string;
      dizziness: string;
      cough: string;
    };
  };
  stepC: {
    title: string;
    subtitle: string;
    modeDevices: string;
    modeRural: string;
    oxygenLabel: string;
    heartRateLabel: string;
    tempLabel: string;
    ruralQuestions: {
      hardToBreathe: string;
      burningHot: string;
      dizzyOrFaint: string;
      yes: string;
      no: string;
    };
  };
  runTriageBtn: string;
  analyzingTriage: string;
  resultView: {
    title: string;
    whyAiChose: string;
    whatNext: string;
    referralCardTitle: string;
    referralSub: string;
    sendToDoctorOffline: string;
    sentToQueueSuccess: string;
    printPass: string;
  };
  queueView: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterAll: string;
    filterEmergency: string;
    filterUrgent: string;
    filterRoutine: string;
    connectBtn: string;
    adviceSentBadge: string;
    emptyTitle: string;
    emptyDesc: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appName: "AuraHealth AI",
    appTagline: "Rural & Remote Smart Triage",
    onlineMode: "Cloud Sync",
    offlineMode: "Local Clinic Mode",
    offlineNotice: "Operating locally. Syncs automatically when cellular data resumes.",
    tabs: {
      checkPatient: "1. Check Patient",
      aiResult: "2. AI Result & Referral",
      doctorQueue: "3. Doctor Queue",
    },
    demoPresets: {
      healthy: "Try Healthy Case",
      urgentFever: "Try Urgent Fever",
      emergency: "Try Emergency Case",
    },
    stepA: {
      title: "Step A: Patient Profile",
      subtitle: "Basic details & chronic pre-conditions",
      nameLabel: "Patient Full Name",
      namePlaceholder: "e.g., Ramesh Kumar / Sunita Devi",
      ageLabel: "Age",
      conditionsLabel: "Known Pre-Existing Conditions",
      diabetes: "Diabetes",
      highBp: "High Blood Pressure",
      pregnancy: "Pregnancy",
    },
    stepB: {
      title: "Step B: Key Symptoms",
      subtitle: "Tap all that apply or speak directly into mic",
      speakButton: "Speak Symptoms",
      listening: "Listening carefully...",
      voiceDetected: "Voice transcribed:",
      symptoms: {
        chest_pain: "Chest Pain / Pressure",
        shortness_of_breath: "Shortness of Breath",
        high_fever: "High Fever & Chills",
        severe_headache: "Severe Headache",
        dizziness: "Dizziness & Faintness",
        cough: "Persistent Cough",
      },
    },
    stepC: {
      title: "Step C: Vitals Assessment",
      subtitle: "Select device readings or visual rural check",
      modeDevices: "I Have Medical Devices",
      modeRural: "No Devices Available (Rural Mode)",
      oxygenLabel: "Oxygen (SpO2)",
      heartRateLabel: "Heart Rate (BPM)",
      tempLabel: "Temperature",
      ruralQuestions: {
        hardToBreathe: "Is the patient struggling to breathe or gasping?",
        burningHot: "Does the forehead/skin feel burning hot to the touch?",
        dizzyOrFaint: "Is the person dizzy, weak, or having fainting spells?",
        yes: "Yes",
        no: "No",
      },
    },
    runTriageBtn: "Run AI Health Check & Add to Priority Queue",
    analyzingTriage: "Analyzing Bio-Parameters...",
    resultView: {
      title: "AI Clinical Assessment",
      whyAiChose: "Why AI Flagged This Priority",
      whatNext: "Recommended Immediate First-Aid & Protocol",
      referralCardTitle: "Digital Rural Referral Pass",
      referralSub: "Priority Tele-Consult & District Hospital Pass",
      sendToDoctorOffline: "Send to Doctor Queue (Works Offline)",
      sentToQueueSuccess: "Transmitted to Doctor Queue & Stored Locally!",
      printPass: "Print / Save Pass",
    },
    queueView: {
      title: "District Doctor Priority Queue",
      subtitle: "AI sorted by clinical acuity: Critical emergencies appear first",
      searchPlaceholder: "Search patient by name or Ref ID...",
      filterAll: "All Patients",
      filterEmergency: "Emergency",
      filterUrgent: "Urgent",
      filterRoutine: "Routine",
      connectBtn: "Connect / Send Advice",
      adviceSentBadge: "Advice Sent",
      emptyTitle: "Queue is Clear",
      emptyDesc: "No pending triage cases currently need physician intervention.",
    },
  },
  hi: {
    appName: "ऑरा हेल्थ एआई",
    appTagline: "ग्रामीण एवं सुदूर स्वास्थ्य जांच",
    onlineMode: "क्लाउड कनेक्ट",
    offlineMode: "ऑफलाइन ग्रामीण मोड",
    offlineNotice: "स्थानीय मोड में सक्रिय। नेटवर्क आने पर स्वतः सिंक होगा।",
    tabs: {
      checkPatient: "१. मरीज की जांच",
      aiResult: "२. एआई परिणाम व रेफरल",
      doctorQueue: "३. डॉक्टर कतार",
    },
    demoPresets: {
      healthy: "सामान्य जांच (स्वस्थ)",
      urgentFever: "तेज बुखार (आवश्यक)",
      emergency: "आपातकालीन स्थिति (रेड)",
    },
    stepA: {
      title: "चरण क: मरीज की जानकारी",
      subtitle: "बुनियादी विवरण और पुरानी बीमारियां",
      nameLabel: "मरीज का पूरा नाम",
      namePlaceholder: "जैसे: रमेश कुमार / सुनीता देवी",
      ageLabel: "आयु (वर्ष)",
      conditionsLabel: "पहले से मौजूद स्वास्थ्य स्थितियां",
      diabetes: "मधुमेह (शुगर)",
      highBp: "हाई बीपी (रक्तचाप)",
      pregnancy: "गर्भावस्था",
    },
    stepB: {
      title: "चरण ख: मुख्य लक्षण",
      subtitle: "जो लक्षण दिखें उन्हें चुनें या बोलकर बताएं",
      speakButton: "लक्षण बोलें",
      listening: "सुन रहे हैं...",
      voiceDetected: "आवाज दर्ज की गई:",
      symptoms: {
        chest_pain: "सीने में दर्द या भारीपन",
        shortness_of_breath: "सांस लेने में तकलीफ",
        high_fever: "तेज बुखार व कंपकंपी",
        severe_headache: "गंभीर सिरदर्द",
        dizziness: "चक्कर आना या कमजोरी",
        cough: "लगातार तेज खांसी",
      },
    },
    stepC: {
      title: "चरण ग: शारीरिक जांच",
      subtitle: "यंत्रों द्वारा माप या बिना यंत्र ग्रामीण जांच",
      modeDevices: "मेरे पास चिकित्सा उपकरण हैं",
      modeRural: "बिना उपकरण (ग्रामीण जांच मोड)",
      oxygenLabel: "ऑक्सीजन (SpO2)",
      heartRateLabel: "हृदय गति (BPM)",
      tempLabel: "शरीर का तापमान",
      ruralQuestions: {
        hardToBreathe: "क्या मरीज को सांस फूल रही है या हांफ रहा है?",
        burningHot: "क्या छूने पर त्वचा या माथा बहुत ज्यादा गरम लग रहा है?",
        dizzyOrFaint: "क्या मरीज को चक्कर आ रहे हैं या बेहोशी छा रही है?",
        yes: "हाँ",
        no: "नहीं",
      },
    },
    runTriageBtn: "एआई जांच करें और प्राथमिकता कतार में जोड़ें",
    analyzingTriage: "विश्लेषण किया जा रहा है...",
    resultView: {
      title: "एआई स्वास्थ्य परिणाम",
      whyAiChose: "एआई ने यह प्राथमिकता क्यों चुनी",
      whatNext: "प्राथमिक उपचार और आवश्यक कदम",
      referralCardTitle: "डिजिटल रेफरल पास",
      referralSub: "सामुदायिक स्वास्थ्य केंद्र व जिला अस्पताल पास",
      sendToDoctorOffline: "डॉक्टर को भेजें (ऑफलाइन भी कार्य करता है)",
      sentToQueueSuccess: "डॉक्टर कतार में दर्ज और सुरक्षित!",
      printPass: "पास प्रिंट / सुरक्षित करें",
    },
    queueView: {
      title: "प्राथमिक डॉक्टर कतार",
      subtitle: "आपातकालीन मरीज सबसे ऊपर क्रमबद्ध",
      searchPlaceholder: "नाम या संदर्भ संख्या से खोजें...",
      filterAll: "सभी मरीज",
      filterEmergency: "आपातकाल",
      filterUrgent: "अतिशीघ्र",
      filterRoutine: "सामान्य",
      connectBtn: "संपर्क / परामर्श भेजें",
      adviceSentBadge: "परामर्श भेजा गया",
      emptyTitle: "कतार खाली है",
      emptyDesc: "वर्तमान में कोई मरीज प्रतीक्षारत नहीं है।",
    },
  },
  kn: {
    appName: "ಆರಾ ಹೆಲ್ತ್ ಎಐ",
    appTagline: "ಗ್ರಾಮೀಣ ಮತ್ತು ದೂರದ ಪ್ರದೇಶಗಳ ಆರೋಗ್ಯ ತಪಾಸಣೆ",
    onlineMode: "ಕ್ಲೌಡ್ ಸಿಂಕ್",
    offlineMode: "ಆಫ್‌ಲೈನ್ ಗ್ರಾಮೀಣ ಮೋಡ್",
    offlineNotice: "ಸ್ಥಳೀಯವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ. ನೆಟ್‌ವರ್ಕ್ ಬಂದಾಗ ಸ್ವಯಂ ಸಿಂಕ್ ಆಗುತ್ತದೆ.",
    tabs: {
      checkPatient: "೧. ರೋಗಿಯ ತಪಾಸಣೆ",
      aiResult: "೨. ಎಐ ಫಲಿತಾಂಶ ಮತ್ತು ಶಿಫಾರಸು",
      doctorQueue: "೩. ವೈದ್ಯರ ಕ್ಯೂ",
    },
    demoPresets: {
      healthy: "ಆರೋಗ್ಯವಂತ ಕೇಸ್",
      urgentFever: "ತುರ್ತು ಜ್ವರ ಕೇಸ್",
      emergency: "ಅತ್ಯಂತ ತುರ್ತು ಕೇಸ್",
    },
    stepA: {
      title: "ಹಂತ ಎ: ರೋಗಿಯ ವಿವರಗಳು",
      subtitle: "ಹೆಸರು, ವಯಸ್ಸು ಮತ್ತು ಹಳೆಯ ಕಾಯಿಲೆಗಳು",
      nameLabel: "ರೋಗಿಯ ಪೂರ್ಣ ಹೆಸರು",
      namePlaceholder: "ಉದಾ: ರಮೇಶ್ ಕುಮಾರ್ / ಸುನಿತಾ",
      ageLabel: "ವಯಸ್ಸು",
      conditionsLabel: "ಹಿಂದಿನ ಆರೋಗ್ಯ ಸಮಸ್ಯೆಗಳು",
      diabetes: "ಮಧುಮೇಹ (ಡಯಾಬಿಟಿಸ್)",
      highBp: "ಅಧಿಕ ರಕ್ತದೊತ್ತಡ (ಬಿಪಿ)",
      pregnancy: "ಗರ್ಭಾವಸ್ಥೆ",
    },
    stepB: {
      title: "ಹಂತ ಬಿ: ಪ್ರಮುಖ ಲಕ್ಷಣಗಳು",
      subtitle: "ಕಾಣಿಸುವ ಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ",
      speakButton: "ಲಕ್ಷಣಗಳನ್ನು ಮಾತನಾಡಿ",
      listening: "ಆಲಿಸುತ್ತಿದೆ...",
      voiceDetected: "ಧ್ವನಿ ದಾಖಲಾಗಿದೆ:",
      symptoms: {
        chest_pain: "ಎದೆ ನೋವು / ಒತ್ತಡ",
        shortness_of_breath: "ಉಸಿರಾಟದ ತೊಂದರೆ",
        high_fever: "ತೀವ್ರ ಜ್ವರ ಮತ್ತು ಚಳಿ",
        severe_headache: "ತೀವ್ರ ತಲೆನೋವು",
        dizziness: "ತಲೆಸುತ್ತು / ಸುಸ್ತು",
        cough: "ನಿರಂತರ ಕೆಮ್ಮು",
      },
    },
    stepC: {
      title: "ಹಂತ ಸಿ: ವೈದ್ಯಕೀಯ ಪರೀಕ್ಷೆ",
      subtitle: "ಉಪಕರಣಗಳಿಂದ ಪರೀಕ್ಷೆ ಅಥವಾ ಸರಳ ಗ್ರಾಮೀಣ ಪರೀಕ್ಷೆ",
      modeDevices: "ವೈದ್ಯಕೀಯ ಉಪಕರಣಗಳು ಇವೆ",
      modeRural: "ಉಪಕರಣಗಳಿಲ್ಲ (ಗ್ರಾಮೀಣ ಮೋಡ್)",
      oxygenLabel: "ಆಮ್ಲಜನಕ (SpO2)",
      heartRateLabel: "ಹೃದಯ ಬಡಿತ (BPM)",
      tempLabel: "ತಾಪಮಾನ",
      ruralQuestions: {
        hardToBreathe: "ಉಸಿರಾಡಲು ತುಂಬಾ ಕಷ್ಟವಾಗುತ್ತಿದೆಯೇ?",
        burningHot: "ಚರ್ಮ ಅಥವಾ ಹಣೆಯು ಅತಿಯಾಗಿ ಬಿಸಿಯಾಗಿದೆಯೇ?",
        dizzyOrFaint: "ತಲೆಸುತ್ತು ಅಥವಾ ಪ್ರಜ್ಞೆ ತಪ್ಪುವಂತಾಗಿದೆಯೇ?",
        yes: "ಹೌದು",
        no: "ಇಲ್ಲ",
      },
    },
    runTriageBtn: "ಎಐ ತಪಾಸಣೆ ನಡೆಸಿ ಮತ್ತು ಕ್ಯೂಗೆ ಸೇರಿಸಿ",
    analyzingTriage: "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
    resultView: {
      title: "ಎಐ ಆರೋಗ್ಯ ವಿಶ್ಲೇಷಣೆ",
      whyAiChose: "ಎಐ ಈ ನಿರ್ಧಾರಕ್ಕೆ ಕಾರಣಗಳು",
      whatNext: "ಮುಂದಿನ ತುರ್ತು ಚಿಕಿತ್ಸಾ ಕ್ರಮಗಳು",
      referralCardTitle: "ಡಿಜಿಟಲ್ ರೆಫರಲ್ ಪಾಸ್",
      referralSub: "ತಾಲೂಕು/ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆ ಆದ್ಯತಾ ಪಾಸ್",
      sendToDoctorOffline: "ವೈದ್ಯರ ಕ್ಯೂಗೆ ಕಳುಹಿಸಿ (ಆಫ್‌ಲೈನ್)",
      sentToQueueSuccess: "ವೈದ್ಯರ ಪಟ್ಟಿಗೆ ಸೇರಿಸಲಾಗಿದೆ!",
      printPass: "ಪಾಸ್ ಮುದ್ರಿಸಿ / ಸೇವ್ ಮಾಡಿ",
    },
    queueView: {
      title: "ವೈದ್ಯರ ಆದ್ಯತಾ ಕ್ಯೂ",
      subtitle: "ತುರ್ತು ಚಿಕಿತ್ಸೆ ಅಗತ್ಯವಿರುವ ರೋಗಿಗಳು ಮೇಲ್ಭಾಗದಲ್ಲಿ",
      searchPlaceholder: "ಹೆಸರು ಅಥವಾ ರೆಫರೆನ್ಸ್ ಐಡಿ ಹುಡುಕಿ...",
      filterAll: "ಎಲ್ಲಾ ರೋಗಿಗಳು",
      filterEmergency: "ಅತ್ಯಂತ ತುರ್ತು",
      filterUrgent: "ತುರ್ತು",
      filterRoutine: "ಸಾಮಾನ್ಯ",
      connectBtn: "ಸಂಪರ್ಕಿಸಿ / ಸಲಹೆ ನೀಡಿ",
      adviceSentBadge: "ಸಲಹೆ ಕಳುಹಿಸಲಾಗಿದೆ",
      emptyTitle: "ಕ್ಯೂ ಖಾಲಿಯಾಗಿದೆ",
      emptyDesc: "ಪ್ರಸ್ತುತ ತುರ್ತು ಗಮನ ಬೇಕಾದ ರೋಗಿಗಳಿಲ್ಲ.",
    },
  },
};
