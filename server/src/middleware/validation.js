export function validateVisitRegistration(req, res, next) {
  const {
    name,
    age,
    gender,
    phone,
    complaint,
    emergency_level,
    vitals_spo2,
    vitals_heart_rate,
    vitals_temperature,
    vitals_bp_systolic,
    vitals_bp_diastolic,
    pain_level,
  } = req.body;

  const errors = [];

  // Required patient info
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Patient name is required (min 2 characters).');
  }

  const parsedAge = parseInt(age, 10);
  if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 125) {
    errors.push('Patient age must be an integer between 0 and 125.');
  }

  if (!gender || typeof gender !== 'string') {
    errors.push('Patient gender is required.');
  }

  // Chief complaint
  if (!complaint || typeof complaint !== 'string' || complaint.trim().length < 2) {
    errors.push('Chief complaint is required (min 2 characters).');
  }

  // Emergency level
  if (!emergency_level || !['emergency', 'urgent', 'normal'].includes(emergency_level)) {
    errors.push("Emergency level must be one of: 'emergency', 'urgent', 'normal'.");
  }

  // Vitals ranges (if provided)
  if (vitals_spo2 !== undefined && vitals_spo2 !== null && vitals_spo2 !== '') {
    const spo2 = Number(vitals_spo2);
    if (isNaN(spo2) || spo2 < 50 || spo2 > 100) {
      errors.push('SpO2 must be between 50% and 100%.');
    }
  }

  if (vitals_heart_rate !== undefined && vitals_heart_rate !== null && vitals_heart_rate !== '') {
    const hr = parseInt(vitals_heart_rate, 10);
    if (isNaN(hr) || hr < 30 || hr > 240) {
      errors.push('Heart rate must be between 30 and 240 BPM.');
    }
  }

  if (vitals_temperature !== undefined && vitals_temperature !== null && vitals_temperature !== '') {
    const temp = Number(vitals_temperature);
    if (isNaN(temp) || temp < 30.0 || temp > 45.0) {
      errors.push('Temperature must be between 30.0°C and 45.0°C.');
    }
  }

  if (vitals_bp_systolic !== undefined && vitals_bp_systolic !== null && vitals_bp_systolic !== '') {
    const sys = parseInt(vitals_bp_systolic, 10);
    if (isNaN(sys) || sys < 50 || sys > 260) {
      errors.push('BP Systolic must be between 50 and 260 mmHg.');
    }
  }

  if (vitals_bp_diastolic !== undefined && vitals_bp_diastolic !== null && vitals_bp_diastolic !== '') {
    const dia = parseInt(vitals_bp_diastolic, 10);
    if (isNaN(dia) || dia < 30 || dia > 160) {
      errors.push('BP Diastolic must be between 30 and 160 mmHg.');
    }
  }

  if (pain_level !== undefined && pain_level !== null && pain_level !== '') {
    const pain = parseInt(pain_level, 10);
    if (isNaN(pain) || pain < 0 || pain > 10) {
      errors.push('Pain level must be an integer between 0 and 10.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

export function validateVisitUpdate(req, res, next) {
  const {
    emergency_level,
    vitals_spo2,
    vitals_heart_rate,
    vitals_temperature,
    vitals_bp_systolic,
    vitals_bp_diastolic,
    pain_level,
  } = req.body;

  const errors = [];

  if (emergency_level && !['emergency', 'urgent', 'normal'].includes(emergency_level)) {
    errors.push("Emergency level must be one of: 'emergency', 'urgent', 'normal'.");
  }

  if (vitals_spo2 !== undefined && vitals_spo2 !== null && vitals_spo2 !== '') {
    const spo2 = Number(vitals_spo2);
    if (isNaN(spo2) || spo2 < 50 || spo2 > 100) {
      errors.push('SpO2 must be between 50% and 100%.');
    }
  }

  if (vitals_heart_rate !== undefined && vitals_heart_rate !== null && vitals_heart_rate !== '') {
    const hr = parseInt(vitals_heart_rate, 10);
    if (isNaN(hr) || hr < 30 || hr > 240) {
      errors.push('Heart rate must be between 30 and 240 BPM.');
    }
  }

  if (vitals_temperature !== undefined && vitals_temperature !== null && vitals_temperature !== '') {
    const temp = Number(vitals_temperature);
    if (isNaN(temp) || temp < 30.0 || temp > 45.0) {
      errors.push('Temperature must be between 30.0°C and 45.0°C.');
    }
  }

  if (pain_level !== undefined && pain_level !== null && pain_level !== '') {
    const pain = parseInt(pain_level, 10);
    if (isNaN(pain) || pain < 0 || pain > 10) {
      errors.push('Pain level must be an integer between 0 and 10.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
}

export function validateDiagnosis(req, res, next) {
  const { diagnosis } = req.body;
  if (!diagnosis || typeof diagnosis !== 'string' || diagnosis.trim().length === 0) {
    return res.status(400).json({ error: 'Diagnosis is required.' });
  }
  next();
}
