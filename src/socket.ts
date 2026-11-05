import { io, Socket } from 'socket.io-client';
import { EmergencyAlertData, Visit } from './types';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to clinic realtime gateway');
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from gateway:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection warning:', err.message);
    });
  }

  return socket;
}

export function subscribeToQueueEvents(callbacks: {
  onQueueUpdated?: (payload: any) => void;
  onPatientCalled?: (visit: Visit) => void;
  onCaseClosed?: (visit: Visit) => void;
  onEmergencyAlert?: (alert: EmergencyAlertData) => void;
}) {
  const s = getSocket();

  if (callbacks.onQueueUpdated) s.on('queue:updated', callbacks.onQueueUpdated);
  if (callbacks.onPatientCalled) s.on('patient:called', callbacks.onPatientCalled);
  if (callbacks.onCaseClosed) s.on('case:closed', callbacks.onCaseClosed);
  if (callbacks.onEmergencyAlert) s.on('patient:emergency-alert', callbacks.onEmergencyAlert);

  return () => {
    if (callbacks.onQueueUpdated) s.off('queue:updated', callbacks.onQueueUpdated);
    if (callbacks.onPatientCalled) s.off('patient:called', callbacks.onPatientCalled);
    if (callbacks.onCaseClosed) s.off('case:closed', callbacks.onCaseClosed);
    if (callbacks.onEmergencyAlert) s.off('patient:emergency-alert', callbacks.onEmergencyAlert);
  };
}
