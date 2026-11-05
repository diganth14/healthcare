import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db.js';

export function runSeed() {
  console.log('[Seed] Initializing database tables...');
  initDatabase();

  console.log('[Seed] Clearing existing demo records...');
  db.exec(`
    DELETE FROM visits;
    DELETE FROM patients;
    DELETE FROM users;
    DELETE FROM sqlite_sequence WHERE name IN ('visits', 'patients', 'users');
  `);

  console.log('[Seed] Creating staff accounts (1 Doctor, 2 Nurses)...');
  const doctorHash = bcrypt.hashSync('doctor123', 10);
  const nurseHash = bcrypt.hashSync('nurse123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, name, role) 
    VALUES (?, ?, ?, ?)
  `);

  const doc = insertUser.run('dr.smith', doctorHash, 'Dr. Arjun Smith', 'doctor');
  const nurse1 = insertUser.run('nurse.mary', nurseHash, "Nurse Mary D'Souza", 'nurse');
  const nurse2 = insertUser.run('nurse.sarah', nurseHash, 'Nurse Sarah Khan', 'nurse');

  const docId = Number(doc.lastInsertRowid);
  const nurse1Id = Number(nurse1.lastInsertRowid);
  const nurse2Id = Number(nurse2.lastInsertRowid);

  console.log('[Seed] Inserting 5 sample patients across Emergency, Urgent, and Normal levels...');
  const insertPatient = db.prepare(`
    INSERT INTO patients (name, age, gender, phone, conditions)
    VALUES (?, ?, ?, ?, ?)
  `);

  const p1 = insertPatient.run('Rajesh Verma', 58, 'Male', '9876543210', JSON.stringify(['diabetes', 'high_bp']));
  const p2 = insertPatient.run('Sunita Devi', 28, 'Female', '9845123456', JSON.stringify(['pregnancy']));
  const p3 = insertPatient.run('Ramesh Rao', 45, 'Male', '9900112233', JSON.stringify(['high_bp']));
  const p4 = insertPatient.run('Meera Bai', 34, 'Female', '9880123789', JSON.stringify([]));
  const p5 = insertPatient.run('Devappa Gowda', 62, 'Male', '9741556677', JSON.stringify(['diabetes']));

  const p1Id = Number(p1.lastInsertRowid);
  const p2Id = Number(p2.lastInsertRowid);
  const p3Id = Number(p3.lastInsertRowid);
  const p4Id = Number(p4.lastInsertRowid);
  const p5Id = Number(p5.lastInsertRowid);

  console.log('[Seed] Creating sample visits for today...');
  const insertVisit = db.prepare(`
    INSERT INTO visits (
      token_number, patient_id, created_by, doctor_id,
      arrival_time, vitals_spo2, vitals_heart_rate, vitals_temperature,
      vitals_bp_systolic, vitals_bp_diastolic, complaint, pain_level,
      symptom_tags, nurse_notes, emergency_level, status,
      diagnosis, prescription, follow_up,
      consultation_start_time, consultation_end_time
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?
    )
  `);

  // Visit 1: Completed earlier today by Patient 5 (Devappa Gowda)
  insertVisit.run(
    1, p5Id, nurse1Id, docId,
    new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    97, 76, 36.7, 130, 84,
    'Fasting blood glucose routine check & diabetic peripheral neuropathy review',
    2,
    JSON.stringify(['numbness', 'fatigue']),
    'Patient brought recent lab reports. Fasting sugar 142 mg/dL.',
    'normal',
    'completed',
    'Type 2 Diabetes Mellitus with mild sensory neuropathy',
    '1. Tab Metformin 500mg BD after meals x 30 days\n2. Tab Methylcobalamin 1500mcg OD x 30 days',
    'Review in clinic after 1 month with HbA1c test report.',
    new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    new Date(Date.now() - 55 * 60 * 1000).toISOString()
  );

  // Visit 2: Emergency (Rajesh Verma) - Waiting in Queue (Should be at top of queue!)
  insertVisit.run(
    2, p1Id, nurse1Id, null,
    new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    88, 128, 37.1, 168, 104,
    'Crushing retrosternal chest pain radiating to left shoulder and jaw; acute gasping breath',
    9,
    JSON.stringify(['chest_pain', 'shortness_of_breath', 'dizziness']),
    'High acute cardiac risk. Oxygen initiated at 3 L/min via nasal cannula. Immediate physician review needed.',
    'emergency',
    'waiting',
    null, null, null, null, null
  );

  // Visit 3: Urgent (Sunita Devi) - Waiting in Queue
  insertVisit.run(
    3, p2Id, nurse2Id, null,
    new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    95, 106, 39.1, 116, 76,
    'Trimester 3 high fever 39.1°C with severe shaking chills, frontal headache and body ache',
    7,
    JSON.stringify(['high_fever', 'severe_headache']),
    'Fetal movements present. Lukewarm sponging done by nurse. Needs prompt obstetric evaluation.',
    'urgent',
    'waiting',
    null, null, null, null, null
  );

  // Visit 4: Urgent (Ramesh Rao) - Waiting in Queue
  insertVisit.run(
    4, p3Id, nurse1Id, null,
    new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    97, 94, 37.4, 144, 92,
    'Sharp right lower quadrant abdominal pain with persistent nausea since morning',
    8,
    JSON.stringify(['dizziness']),
    'Guarding noted on palpation. Nil orally advised until physician exam.',
    'urgent',
    'waiting',
    null, null, null, null, null
  );

  // Visit 5: Normal (Meera Bai) - Waiting in Queue
  insertVisit.run(
    5, p4Id, nurse2Id, null,
    new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    99, 70, 36.6, 118, 74,
    'Mild dry throat tickle, occasional cough and clear nasal discharge for 3 days',
    1,
    JSON.stringify(['cough']),
    'Vitals stable. Lungs clear to auscultation. General routine outpatient check.',
    'normal',
    'waiting',
    null, null, null, null, null
  );

  console.log('[Seed] Database successfully seeded with staff and 5 patient visits!');
}

// Run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed();
  process.exit(0);
}
