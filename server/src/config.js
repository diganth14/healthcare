import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_clinic_secret_key_2026';
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
export const DATABASE_PATH = path.resolve(__dirname, '..', process.env.DATABASE_PATH || './data/clinic.db');
export const BACKUP_DIR = path.resolve(__dirname, '..', process.env.BACKUP_DIR || './backups');
