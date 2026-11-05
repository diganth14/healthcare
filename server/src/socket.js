import { Server } from 'socket.io';
import { CLIENT_ORIGIN } from './config.js';

let ioInstance = null;

export function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized yet.');
  }
  return ioInstance;
}

export function emitQueueUpdated(payload = null) {
  if (ioInstance) {
    ioInstance.emit('queue:updated', payload);
  }
}

export function emitPatientCalled(visit) {
  if (ioInstance) {
    ioInstance.emit('patient:called', visit);
  }
}

export function emitCaseClosed(visit) {
  if (ioInstance) {
    ioInstance.emit('case:closed', visit);
  }
}

export function emitEmergencyAlert(alertData) {
  if (ioInstance) {
    ioInstance.emit('patient:emergency-alert', alertData);
  }
}
