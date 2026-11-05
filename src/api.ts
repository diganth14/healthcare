import { 
  User, 
  QueueResponse, 
  Visit, 
  Patient, 
  StatsResponse 
} from './types';

const TOKEN_KEY = 'clinic_jwt_token';
const USER_KEY = 'clinic_user_data';

const API_BASE_URL = 'https://healthcare-api-xowz.onrender.com';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: User) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearStoredAuth();
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Authentication
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredAuth(res.token, res.user);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return apiFetch<{ user: User }>('/api/auth/me');
  },

  // Queue
  async getQueue(): Promise<QueueResponse> {
    return apiFetch<QueueResponse>('/api/queue');
  },

  // Visits
  async registerVisit(data: any): Promise<{ message: string; visit: Visit }> {
    return apiFetch<{ message: string; visit: Visit }>('/api/visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async editVisit(visitId: number, data: any): Promise<{ message: string; visit: Visit }> {
    return apiFetch<{ message: string; visit: Visit }>(`/api/visits/${visitId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async cancelVisit(visitId: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/visits/${visitId}/cancel`, {
      method: 'POST',
    });
  },

  async moveVisit(visitId: number, direction: 'up' | 'down'): Promise<{ message: string; visit: Visit }> {
    return apiFetch<{ message: string; visit: Visit }>(`/api/visits/${visitId}/move`, {
      method: 'POST',
      body: JSON.stringify({ direction }),
    });
  },

  async callNextPatient(): Promise<{ message: string; visit: Visit }> {
    return apiFetch<{ message: string; visit: Visit }>('/api/visits/call-next', {
      method: 'POST',
    });
  },

  async getVisitDetails(visitId: number): Promise<{ visit: Visit; pastVisits: Visit[] }> {
    return apiFetch<{ visit: Visit; pastVisits: Visit[] }>(`/api/visits/${visitId}`);
  },

  async saveDiagnosis(visitId: number, payload: {
    diagnosis?: string;
    prescription?: string;
    follow_up?: string;
  }): Promise<{ message: string; visit: Visit }> {
    return apiFetch<{ message: string; visit: Visit }>(`/api/visits/${visitId}/diagnosis`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async closeCase(visitId: number): Promise<{ message: string; visit: Visit }> {
    return apiFetch<{ message: string; visit: Visit }>(`/api/visits/${visitId}/close`, {
      method: 'POST',
    });
  },

  async getCompletedToday(): Promise<{ completed: Visit[] }> {
    return apiFetch<{ completed: Visit[] }>('/api/visits/completed/today');
  },

  // Patients
  async searchPatients(query: string): Promise<{ patients: Patient[] }> {
    return apiFetch<{ patients: Patient[] }>(`/api/patients/search?q=${encodeURIComponent(query)}`);
  },

  async getPatientHistory(patientId: number): Promise<{ patient: Patient; visits: Visit[] }> {
    return apiFetch<{ patient: Patient; visits: Visit[] }>(`/api/patients/${patientId}/history`);
  },

  // End-of-Day Stats
  async getTodayStats(): Promise<StatsResponse> {
    return apiFetch<StatsResponse>('/api/visits/stats/today');
  },
};