import { DatabaseSync, backup } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { DATABASE_PATH, BACKUP_DIR } from './config.js';

// Ensure data and backup directories exist
const dataDir = path.dirname(DATABASE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const db = new DatabaseSync(DATABASE_PATH);

// Configure SQLite for high performance and integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA synchronous = NORMAL;');

// Provide transaction helper compatible with better-sqlite3
db.transaction = function (fn) {
  return (...args) => {
    db.exec('BEGIN IMMEDIATE;');
    try {
      const result = fn(...args);
      db.exec('COMMIT;');
      return result;
    } catch (err) {
      try {
        db.exec('ROLLBACK;');
      } catch (rollbackErr) {
        // Rollback error can occur if transaction already failed
      }
      throw err;
    }
  };
};

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('doctor', 'nurse')),
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT,
      conditions TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_number INTEGER NOT NULL,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id),
      doctor_id INTEGER REFERENCES users(id),
      arrival_time TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      vitals_spo2 REAL,
      vitals_heart_rate INTEGER,
      vitals_temperature REAL,
      vitals_bp_systolic INTEGER,
      vitals_bp_diastolic INTEGER,
      complaint TEXT NOT NULL,
      pain_level INTEGER DEFAULT 0,
      symptom_tags TEXT DEFAULT '[]',
      nurse_notes TEXT,
      emergency_level TEXT NOT NULL CHECK(emergency_level IN ('emergency', 'urgent', 'normal')),
      status TEXT NOT NULL CHECK(status IN ('waiting', 'in_consultation', 'completed', 'cancelled')) DEFAULT 'waiting',
      diagnosis TEXT,
      prescription TEXT,
      follow_up TEXT,
      consultation_start_time TEXT,
      consultation_end_time TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
    CREATE INDEX IF NOT EXISTS idx_visits_emergency ON visits(emergency_level);
    CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(created_at);
    CREATE INDEX IF NOT EXISTS idx_patients_search ON patients(name, phone);
  `);

  // A doctor's manual queue placement (see the move endpoint in routes/visits.js).
  // Databases created before this column existed get it added here.
  const visitColumns = db.prepare('PRAGMA table_info(visits)').all().map(column => column.name);
  if (!visitColumns.includes('queue_key')) {
    db.exec('ALTER TABLE visits ADD COLUMN queue_key REAL');
  }
}

/**
 * Creates an automatic daily backup of the SQLite database
 */
export async function backupDatabase() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const backupFile = path.join(BACKUP_DIR, `clinic-${today}.db`);
    
    // SQLite native backup API
    if (typeof backup === 'function') {
      await backup(db, backupFile);
    } else {
      // Fallback file copy if needed
      fs.copyFileSync(DATABASE_PATH, backupFile);
    }
    
    console.log(`[Backup] Database successfully backed up to: ${backupFile}`);

    // Prune backups older than 14 days
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR);
      const now = Date.now();
      const maxAge = 14 * 24 * 60 * 60 * 1000;
      for (const file of files) {
        if (file.startsWith('clinic-') && file.endsWith('.db')) {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`[Backup] Pruned old backup: ${file}`);
          }
        }
      }
    }
    return backupFile;
  } catch (err) {
    console.error('[Backup Error] Failed to backup database:', err);
    return null;
  }
}
