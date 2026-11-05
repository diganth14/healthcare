import express from 'express';
import http from 'http';
import cors from 'cors';
import { PORT, CLIENT_ORIGIN } from './config.js';
import { initDatabase, backupDatabase } from './db.js';
import { runSeed } from './seed.js'; // Correctly import runSeed
import { initSocket } from './socket.js';
import { authRouter } from './routes/auth.js';
import { patientsRouter } from './routes/patients.js';
import { visitsRouter } from './routes/visits.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://192.168.') || origin.startsWith('http://10.')) {
      return callback(null, true);
    }
    if (origin === CLIENT_ORIGIN) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/visits', visitsRouter);

// Forward /api/queue directly to visits router
app.get('/api/queue', (req, res, next) => {
  req.url = '/queue';
  visitsRouter.handle(req, res, next);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.',
  });
});

// Initialize database schema and automatically seed demo accounts if empty
initDatabase();
try {
  runSeed();
  console.log('[Database] Auto-seed completed successfully.');
} catch (seedErr) {
  console.error('[Auto-Seed Warning]', seedErr);
}

// Run immediate startup backup and schedule recurring 24-hour backup
backupDatabase().catch(err => console.error('[Initial Backup Warning]', err));
setInterval(() => {
  backupDatabase().catch(err => console.error('[Daily Backup Warning]', err));
}, 24 * 60 * 60 * 1000);

// Listen on all network interfaces (0.0.0.0)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🏥 Clinic Patient-Flow Server running on port ${PORT}`);
  console.log(`📡 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
  console.log(`====================================================`);
});