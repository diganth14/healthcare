import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

export const patientsRouter = express.Router();

// Search patients by name or phone
patientsRouter.get('/search', authenticateToken, (req, res) => {
  const query = req.query.q ? req.query.q.trim() : '';

  if (!query || query.length < 1) {
    return res.json({ patients: [] });
  }

  try {
    const searchPattern = `%${query}%`;
    const patients = db.prepare(`
      SELECT 
        p.*,
        COUNT(v.id) AS total_visits,
        MAX(v.arrival_time) AS last_visit_date
      FROM patients p
      LEFT JOIN visits v ON v.patient_id = p.id
      WHERE p.name LIKE ? OR p.phone LIKE ?
      GROUP BY p.id
      ORDER BY last_visit_date DESC, p.name ASC
      LIMIT 15
    `).all(searchPattern, searchPattern);

    // Parse conditions JSON
    const formatted = patients.map(p => ({
      ...p,
      conditions: p.conditions ? JSON.parse(p.conditions) : [],
    }));

    res.json({ patients: formatted });
  } catch (err) {
    console.error('[Patient Search Error]', err);
    res.status(500).json({ error: 'Failed to search patients.' });
  }
});

// Get patient history
patientsRouter.get('/:id/history', authenticateToken, (req, res) => {
  const patientId = parseInt(req.params.id, 10);
  if (isNaN(patientId)) {
    return res.status(400).json({ error: 'Invalid patient ID.' });
  }

  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const visits = db.prepare(`
      SELECT 
        v.*,
        u_doc.name AS doctor_name,
        u_nurse.name AS nurse_name
      FROM visits v
      LEFT JOIN users u_doc ON u_doc.id = v.doctor_id
      LEFT JOIN users u_nurse ON u_nurse.id = v.created_by
      WHERE v.patient_id = ?
      ORDER BY v.arrival_time DESC
    `).all(patientId);

    const formattedVisits = visits.map(v => ({
      ...v,
      symptom_tags: v.symptom_tags ? JSON.parse(v.symptom_tags) : [],
    }));

    res.json({
      patient: {
        ...patient,
        conditions: patient.conditions ? JSON.parse(patient.conditions) : [],
      },
      visits: formattedVisits,
    });
  } catch (err) {
    console.error('[Patient History Error]', err);
    res.status(500).json({ error: 'Failed to retrieve patient history.' });
  }
});
