import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
  validateVisitRegistration, 
  validateVisitUpdate, 
  validateDiagnosis 
} from '../middleware/validation.js';
import { 
  emitQueueUpdated, 
  emitPatientCalled, 
  emitCaseClosed, 
  emitEmergencyAlert 
} from '../socket.js';

export const visitsRouter = express.Router();

/**
 * Helper to fetch a full visit object with patient and user info
 */
function getFullVisit(visitId) {
  const row = db.prepare(`
    SELECT 
      v.*,
      p.name AS patient_name,
      p.age AS patient_age,
      p.gender AS patient_gender,
      p.phone AS patient_phone,
      p.conditions AS patient_conditions,
      u_doc.name AS doctor_name,
      u_nurse.name AS nurse_name
    FROM visits v
    JOIN patients p ON p.id = v.patient_id
    LEFT JOIN users u_doc ON u_doc.id = v.doctor_id
    LEFT JOIN users u_nurse ON u_nurse.id = v.created_by
    WHERE v.id = ?
  `).get(visitId);

  if (!row) return null;

  return {
    ...row,
    symptom_tags: row.symptom_tags ? JSON.parse(row.symptom_tags) : [],
    patient_conditions: row.patient_conditions ? JSON.parse(row.patient_conditions) : [],
  };
}

/**
 * GET /api/queue
 * Returns currently active queue and the patient in consultation
 */
visitsRouter.get('/queue', authenticateToken, (req, res) => {
  try {
    // 1. Current in consultation
    const inConsultationRow = db.prepare(`
      SELECT 
        v.*,
        p.name AS patient_name,
        p.age AS patient_age,
        p.gender AS patient_gender,
        p.phone AS patient_phone,
        p.conditions AS patient_conditions,
        u_doc.name AS doctor_name,
        u_nurse.name AS nurse_name
      FROM visits v
      JOIN patients p ON p.id = v.patient_id
      LEFT JOIN users u_doc ON u_doc.id = v.doctor_id
      LEFT JOIN users u_nurse ON u_nurse.id = v.created_by
      WHERE v.status = 'in_consultation'
      ORDER BY v.consultation_start_time DESC
      LIMIT 1
    `).get();

    const inConsultation = inConsultationRow ? {
      ...inConsultationRow,
      symptom_tags: inConsultationRow.symptom_tags ? JSON.parse(inConsultationRow.symptom_tags) : [],
      patient_conditions: inConsultationRow.patient_conditions ? JSON.parse(inConsultationRow.patient_conditions) : [],
    } : null;

    // 2. Waiting queue sorted by emergency level (emergency -> urgent -> normal) then arrival time
    const waitingRows = db.prepare(`
      SELECT 
        v.*,
        p.name AS patient_name,
        p.age AS patient_age,
        p.gender AS patient_gender,
        p.phone AS patient_phone,
        p.conditions AS patient_conditions,
        u_nurse.name AS nurse_name
      FROM visits v
      JOIN patients p ON p.id = v.patient_id
      LEFT JOIN users u_nurse ON u_nurse.id = v.created_by
      WHERE v.status = 'waiting'
      ORDER BY 
        CASE v.emergency_level 
          WHEN 'emergency' THEN 1 
          WHEN 'urgent' THEN 2 
          WHEN 'normal' THEN 3 
          ELSE 4 
        END ASC,
        v.arrival_time ASC
    `).all();

    const waitingQueue = waitingRows.map(row => ({
      ...row,
      symptom_tags: row.symptom_tags ? JSON.parse(row.symptom_tags) : [],
      patient_conditions: row.patient_conditions ? JSON.parse(row.patient_conditions) : [],
    }));

    const emergencyCount = waitingQueue.filter(v => v.emergency_level === 'emergency').length;
    const urgentCount = waitingQueue.filter(v => v.emergency_level === 'urgent').length;
    const normalCount = waitingQueue.filter(v => v.emergency_level === 'normal').length;

    res.json({
      inConsultation,
      waitingQueue,
      counts: {
        totalWaiting: waitingQueue.length,
        emergencyCount,
        urgentCount,
        normalCount,
      },
    });
  } catch (err) {
    console.error('[Get Queue Error]', err);
    res.status(500).json({ error: 'Failed to fetch clinical queue.' });
  }
});

/**
 * POST /api/visits
 * Register new visit (Nurse only)
 */
visitsRouter.post('/', authenticateToken, requireRole('nurse'), validateVisitRegistration, (req, res) => {
  const {
    patient_id,
    name,
    age,
    gender,
    phone,
    conditions,
    complaint,
    emergency_level,
    vitals_spo2,
    vitals_heart_rate,
    vitals_temperature,
    vitals_bp_systolic,
    vitals_bp_diastolic,
    pain_level,
    symptom_tags,
    nurse_notes,
  } = req.body;

  try {
    const registerTransaction = db.transaction(() => {
      let finalPatientId = patient_id ? parseInt(patient_id, 10) : null;

      // 1. Check or create permanent patient record
      if (finalPatientId) {
        const existing = db.prepare('SELECT id FROM patients WHERE id = ?').get(finalPatientId);
        if (existing) {
          // Update patient profile if provided
          db.prepare(`
            UPDATE patients 
            SET name = ?, age = ?, gender = ?, phone = ?, conditions = ?, updated_at = datetime('now', 'localtime')
            WHERE id = ?
          `).run(
            name.trim(),
            parseInt(age, 10),
            gender,
            phone ? phone.trim() : null,
            JSON.stringify(conditions || []),
            finalPatientId
          );
        } else {
          finalPatientId = null;
        }
      }

      if (!finalPatientId) {
        // Create new patient record
        const insertPatient = db.prepare(`
          INSERT INTO patients (name, age, gender, phone, conditions)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          name.trim(),
          parseInt(age, 10),
          gender,
          phone ? phone.trim() : null,
          JSON.stringify(conditions || [])
        );
        finalPatientId = Number(insertPatient.lastInsertRowid);
      }

      // 2. Compute today's sequential token number (resets daily)
      const tokenRow = db.prepare(`
        SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token 
        FROM visits 
        WHERE DATE(created_at) = DATE('now', 'localtime')
      `).get();
      const tokenNumber = tokenRow ? tokenRow.next_token : 1;

      // 3. Insert visit
      const insertVisit = db.prepare(`
        INSERT INTO visits (
          token_number,
          patient_id,
          created_by,
          arrival_time,
          vitals_spo2,
          vitals_heart_rate,
          vitals_temperature,
          vitals_bp_systolic,
          vitals_bp_diastolic,
          complaint,
          pain_level,
          symptom_tags,
          nurse_notes,
          emergency_level,
          status
        ) VALUES (?, ?, ?, datetime('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting')
      `).run(
        tokenNumber,
        finalPatientId,
        req.user.id,
        vitals_spo2 ? Number(vitals_spo2) : null,
        vitals_heart_rate ? parseInt(vitals_heart_rate, 10) : null,
        vitals_temperature ? Number(vitals_temperature) : null,
        vitals_bp_systolic ? parseInt(vitals_bp_systolic, 10) : null,
        vitals_bp_diastolic ? parseInt(vitals_bp_diastolic, 10) : null,
        complaint.trim(),
        pain_level ? parseInt(pain_level, 10) : 0,
        JSON.stringify(symptom_tags || []),
        nurse_notes ? nurse_notes.trim() : null,
        emergency_level
      );

      const visitId = Number(insertVisit.lastInsertRowid);
      return getFullVisit(visitId);
    });

    const newVisit = registerTransaction();

    // Socket.IO notifications
    emitQueueUpdated({ type: 'VISIT_REGISTERED', visitId: newVisit.id });

    // If emergency, send real-time toast alert to doctor immediately!
    if (newVisit.emergency_level === 'emergency') {
      emitEmergencyAlert({
        visitId: newVisit.id,
        token_number: newVisit.token_number,
        patient_name: newVisit.patient_name,
        complaint: newVisit.complaint,
        emergency_level: 'emergency',
        arrival_time: newVisit.arrival_time,
      });
    }

    res.status(201).json({
      message: 'Visit registered successfully.',
      visit: newVisit,
    });
  } catch (err) {
    console.error('[Register Visit Error]', err);
    res.status(500).json({ error: 'Failed to register patient visit.' });
  }
});

/**
 * PUT /api/visits/:id
 * Edit patient or visit details (Nurse only)
 */
visitsRouter.put('/:id', authenticateToken, requireRole('nurse'), validateVisitUpdate, (req, res) => {
  const visitId = parseInt(req.params.id, 10);
  if (isNaN(visitId)) {
    return res.status(400).json({ error: 'Invalid visit ID.' });
  }

  const {
    name,
    age,
    gender,
    phone,
    conditions,
    complaint,
    emergency_level,
    vitals_spo2,
    vitals_heart_rate,
    vitals_temperature,
    vitals_bp_systolic,
    vitals_bp_diastolic,
    pain_level,
    symptom_tags,
    nurse_notes,
  } = req.body;

  try {
    const editTransaction = db.transaction(() => {
      const current = db.prepare('SELECT * FROM visits WHERE id = ?').get(visitId);
      if (!current) {
        throw new Error('NOT_FOUND');
      }

      // Update patient demographics
      if (name || age || gender || phone || conditions) {
        db.prepare(`
          UPDATE patients
          SET 
            name = COALESCE(?, name),
            age = COALESCE(?, age),
            gender = COALESCE(?, gender),
            phone = COALESCE(?, phone),
            conditions = COALESCE(?, conditions),
            updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(
          name ? name.trim() : null,
          age ? parseInt(age, 10) : null,
          gender || null,
          phone ? phone.trim() : null,
          conditions ? JSON.stringify(conditions) : null,
          current.patient_id
        );
      }

      // Update visit info
      db.prepare(`
        UPDATE visits
        SET
          complaint = COALESCE(?, complaint),
          emergency_level = COALESCE(?, emergency_level),
          vitals_spo2 = ?,
          vitals_heart_rate = ?,
          vitals_temperature = ?,
          vitals_bp_systolic = ?,
          vitals_bp_diastolic = ?,
          pain_level = COALESCE(?, pain_level),
          symptom_tags = COALESCE(?, symptom_tags),
          nurse_notes = COALESCE(?, nurse_notes),
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(
        complaint ? complaint.trim() : null,
        emergency_level || null,
        vitals_spo2 !== undefined ? (vitals_spo2 ? Number(vitals_spo2) : null) : current.vitals_spo2,
        vitals_heart_rate !== undefined ? (vitals_heart_rate ? parseInt(vitals_heart_rate, 10) : null) : current.vitals_heart_rate,
        vitals_temperature !== undefined ? (vitals_temperature ? Number(vitals_temperature) : null) : current.vitals_temperature,
        vitals_bp_systolic !== undefined ? (vitals_bp_systolic ? parseInt(vitals_bp_systolic, 10) : null) : current.vitals_bp_systolic,
        vitals_bp_diastolic !== undefined ? (vitals_bp_diastolic ? parseInt(vitals_bp_diastolic, 10) : null) : current.vitals_bp_diastolic,
        pain_level !== undefined ? parseInt(pain_level, 10) : null,
        symptom_tags ? JSON.stringify(symptom_tags) : null,
        nurse_notes !== undefined ? (nurse_notes ? nurse_notes.trim() : null) : current.nurse_notes,
        visitId
      );

      return getFullVisit(visitId);
    });

    const updated = editTransaction();
    emitQueueUpdated({ type: 'VISIT_UPDATED', visitId: updated.id });

    res.json({
      message: 'Visit updated successfully.',
      visit: updated,
    });
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Visit not found.' });
    }
    console.error('[Edit Visit Error]', err);
    res.status(500).json({ error: 'Failed to update visit.' });
  }
});

/**
 * POST /api/visits/:id/cancel
 * Cancel a no-show visit (Nurse only)
 */
visitsRouter.post('/:id/cancel', authenticateToken, requireRole('nurse'), (req, res) => {
  const visitId = parseInt(req.params.id, 10);
  if (isNaN(visitId)) {
    return res.status(400).json({ error: 'Invalid visit ID.' });
  }

  try {
    const visit = db.prepare('SELECT id, status FROM visits WHERE id = ?').get(visitId);
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found.' });
    }

    if (visit.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed visit.' });
    }

    db.prepare(`
      UPDATE visits 
      SET status = 'cancelled', updated_at = datetime('now', 'localtime') 
      WHERE id = ?
    `).run(visitId);

    emitQueueUpdated({ type: 'VISIT_CANCELLED', visitId });

    res.json({ message: 'Visit cancelled successfully.' });
  } catch (err) {
    console.error('[Cancel Visit Error]', err);
    res.status(500).json({ error: 'Failed to cancel visit.' });
  }
});

/**
 * POST /api/visits/call-next
 * Doctor calls the next waiting patient
 * MUST EXECUTE IN A TRANSACTION!
 */
visitsRouter.post('/call-next', authenticateToken, requireRole('doctor'), (req, res) => {
  try {
    const callNextTransaction = db.transaction(() => {
      // 1. Verify no patient is currently in consultation
      const active = db.prepare(`
        SELECT id, token_number FROM visits 
        WHERE status = 'in_consultation'
      `).get();

      if (active) {
        throw new Error('ROOM_OCCUPIED');
      }

      // 2. Select top waiting patient ordered by emergency_level, then arrival_time
      const nextVisit = db.prepare(`
        SELECT id FROM visits 
        WHERE status = 'waiting'
        ORDER BY 
          CASE emergency_level 
            WHEN 'emergency' THEN 1 
            WHEN 'urgent' THEN 2 
            WHEN 'normal' THEN 3 
            ELSE 4 
          END ASC,
          arrival_time ASC
        LIMIT 1
      `).get();

      if (!nextVisit) {
        throw new Error('QUEUE_EMPTY');
      }

      // 3. Mark in consultation
      db.prepare(`
        UPDATE visits 
        SET 
          status = 'in_consultation',
          doctor_id = ?,
          consultation_start_time = datetime('now', 'localtime'),
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(req.user.id, nextVisit.id);

      return getFullVisit(nextVisit.id);
    });

    const calledVisit = callNextTransaction();

    emitPatientCalled(calledVisit);
    emitQueueUpdated({ type: 'PATIENT_CALLED', visitId: calledVisit.id });

    res.json({
      message: 'Next patient called into consultation.',
      visit: calledVisit,
    });
  } catch (err) {
    if (err.message === 'ROOM_OCCUPIED') {
      return res.status(400).json({ 
        error: 'Consulting room is currently occupied. Please complete and close the current case first.' 
      });
    }
    if (err.message === 'QUEUE_EMPTY') {
      return res.status(404).json({ error: 'No patients waiting in queue.' });
    }
    console.error('[Call Next Error]', err);
    res.status(500).json({ error: 'Failed to call next patient.' });
  }
});

/**
 * GET /api/visits/:id
 * Get visit details including past patient records
 */
visitsRouter.get('/:id', authenticateToken, (req, res) => {
  const visitId = parseInt(req.params.id, 10);
  if (isNaN(visitId)) {
    return res.status(400).json({ error: 'Invalid visit ID.' });
  }

  try {
    const visit = getFullVisit(visitId);
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found.' });
    }

    // Get previous visits of the same patient
    const pastVisits = db.prepare(`
      SELECT 
        v.id,
        v.token_number,
        v.arrival_time,
        v.complaint,
        v.emergency_level,
        v.diagnosis,
        v.prescription,
        v.status,
        v.consultation_end_time,
        u_doc.name AS doctor_name
      FROM visits v
      LEFT JOIN users u_doc ON u_doc.id = v.doctor_id
      WHERE v.patient_id = ? AND v.id != ?
      ORDER BY v.arrival_time DESC
    `).all(visit.patient_id, visitId);

    res.json({
      visit,
      pastVisits,
    });
  } catch (err) {
    console.error('[Get Visit Details Error]', err);
    res.status(500).json({ error: 'Failed to retrieve visit details.' });
  }
});

/**
 * PUT /api/visits/:id/diagnosis
 * Save diagnosis, prescription and follow-up (Doctor only - auto-save as draft)
 */
visitsRouter.put('/:id/diagnosis', authenticateToken, requireRole('doctor'), (req, res) => {
  const visitId = parseInt(req.params.id, 10);
  if (isNaN(visitId)) {
    return res.status(400).json({ error: 'Invalid visit ID.' });
  }

  const { diagnosis, prescription, follow_up } = req.body;

  try {
    const visit = db.prepare('SELECT id, status FROM visits WHERE id = ?').get(visitId);
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found.' });
    }

    db.prepare(`
      UPDATE visits
      SET 
        diagnosis = ?,
        prescription = ?,
        follow_up = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      diagnosis !== undefined ? diagnosis : null,
      prescription !== undefined ? prescription : null,
      follow_up !== undefined ? follow_up : null,
      visitId
    );

    const updated = getFullVisit(visitId);
    emitQueueUpdated({ type: 'DIAGNOSIS_SAVED', visitId });

    res.json({
      message: 'Diagnosis draft saved successfully.',
      visit: updated,
    });
  } catch (err) {
    console.error('[Save Diagnosis Error]', err);
    res.status(500).json({ error: 'Failed to save diagnosis.' });
  }
});

/**
 * POST /api/visits/:id/close
 * Close case and mark completed (Doctor only)
 * MUST EXECUTE IN A TRANSACTION!
 */
visitsRouter.post('/:id/close', authenticateToken, requireRole('doctor'), (req, res) => {
  const visitId = parseInt(req.params.id, 10);
  if (isNaN(visitId)) {
    return res.status(400).json({ error: 'Invalid visit ID.' });
  }

  try {
    const closeCaseTransaction = db.transaction(() => {
      const visit = db.prepare('SELECT * FROM visits WHERE id = ?').get(visitId);
      if (!visit) {
        throw new Error('NOT_FOUND');
      }

      if (visit.status !== 'in_consultation') {
        throw new Error('NOT_IN_CONSULTATION');
      }

      // Diagnosis MUST be filled before closing!
      if (!visit.diagnosis || visit.diagnosis.trim().length === 0) {
        throw new Error('DIAGNOSIS_REQUIRED');
      }

      db.prepare(`
        UPDATE visits
        SET 
          status = 'completed',
          consultation_end_time = datetime('now', 'localtime'),
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(visitId);

      return getFullVisit(visitId);
    });

    const completedVisit = closeCaseTransaction();

    emitCaseClosed(completedVisit);
    emitQueueUpdated({ type: 'CASE_CLOSED', visitId });

    res.json({
      message: 'Case closed and consultation completed successfully.',
      visit: completedVisit,
    });
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Visit not found.' });
    }
    if (err.message === 'NOT_IN_CONSULTATION') {
      return res.status(400).json({ error: 'Case cannot be closed: visit is not currently in consultation.' });
    }
    if (err.message === 'DIAGNOSIS_REQUIRED') {
      return res.status(400).json({ error: 'Diagnosis must be saved before closing case.' });
    }
    console.error('[Close Case Error]', err);
    res.status(500).json({ error: 'Failed to close case.' });
  }
});

/**
 * GET /api/visits/completed/today
 * Today's completed list
 */
visitsRouter.get('/completed/today', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        v.*,
        p.name AS patient_name,
        p.age AS patient_age,
        p.gender AS patient_gender,
        p.phone AS patient_phone,
        u_doc.name AS doctor_name,
        u_nurse.name AS nurse_name
      FROM visits v
      JOIN patients p ON p.id = v.patient_id
      LEFT JOIN users u_doc ON u_doc.id = v.doctor_id
      LEFT JOIN users u_nurse ON u_nurse.id = v.created_by
      WHERE v.status = 'completed'
        AND DATE(v.created_at) = DATE('now', 'localtime')
      ORDER BY v.consultation_end_time DESC
    `).all();

    const completed = rows.map(r => ({
      ...r,
      symptom_tags: r.symptom_tags ? JSON.parse(r.symptom_tags) : [],
    }));

    res.json({ completed });
  } catch (err) {
    console.error('[Completed Today Error]', err);
    res.status(500).json({ error: "Failed to fetch today's completed visits." });
  }
});

/**
 * GET /api/stats/today
 * End-of-day stats for doctor portal
 */
visitsRouter.get('/stats/today', authenticateToken, requireRole('doctor'), (req, res) => {
  try {
    const statsRow = db.prepare(`
      SELECT 
        COUNT(*) AS patients_seen,
        AVG(
          (julianday(consultation_end_time) - julianday(arrival_time)) * 24 * 60
        ) AS avg_wait_minutes,
        AVG(
          (julianday(consultation_end_time) - julianday(consultation_start_time)) * 24 * 60
        ) AS avg_consult_minutes
      FROM visits
      WHERE status = 'completed'
        AND DATE(created_at) = DATE('now', 'localtime')
    `).get();

    const emergencyBreakdown = db.prepare(`
      SELECT emergency_level, COUNT(*) AS count
      FROM visits
      WHERE DATE(created_at) = DATE('now', 'localtime')
      GROUP BY emergency_level
    `).all();

    res.json({
      patientsSeen: statsRow ? (statsRow.patients_seen || 0) : 0,
      avgWaitMinutes: statsRow && statsRow.avg_wait_minutes ? Math.round(statsRow.avg_wait_minutes) : 0,
      avgConsultMinutes: statsRow && statsRow.avg_consult_minutes ? Math.round(statsRow.avg_consult_minutes) : 0,
      emergencyBreakdown,
    });
  } catch (err) {
    console.error('[Stats Error]', err);
    res.status(500).json({ error: 'Failed to calculate clinical stats.' });
  }
});
