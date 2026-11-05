# AI Healthcare Triage & Patient-Flow Platform

An intelligent, real-time patient-flow and triage management system built for remote clinics and primary healthcare centers. Designed with an Apple VisionOS frosted glass aesthetic, spatial cards, and instant dual-portal WebSocket synchronization between Nurses and Doctors.

---

## 🌟 Key Features

### 🩺 Nurse Portal
- **Rapid Patient Registration**: Instant intake form with name, phone, age, gender, complaint, and vitals.
- **Returning Patient Autocomplete**: Type name or phone to automatically pull up medical history.
- **Smart Triage Auto-Suggestion**: Analyzes vitals (SpO2, Pulse, Blood Pressure, Temp, Pain Level) to automatically suggest:
  - 🔴 **Emergency** (Immediate doctor attention, top priority)
  - 🟠 **Urgent** (Same-day clinical review)
  - 🟢 **Normal** (Standard routine queue)
  - *Nurse override supported at any time.*
- **Live Queue Management**: Real-time sorted waiting list by emergency priority first, then arrival time.
- **Wait Time Tracking**: Live counter showing minutes waiting and "Next to enter Doctor's room" indicator.
- **Edit & Cancellation**: Update patient vitals on the fly or mark no-shows as cancelled.
- **Completed Visits & Print Passes**: View today's closed cases and print visit passes / referral slips.

### 👨‍⚕️ Doctor Portal
- **Consultation Room Flow**: "Call Next Patient" atomically assigns the next prioritized waiting patient.
- **Comprehensive Clinical View**: Displays patient demographics, vitals, pain level, symptom tags, and arrival timestamps.
- **Patient History Panel**: View past clinic visits, previous diagnoses, and medications for returning patients.
- **Draft Auto-Saving**: Real-time debounced autosave for diagnosis, clinical notes, prescriptions, and follow-up plans.
- **Safe Case Closure**: Requires diagnosis before closing; completes the visit and frees the room.
- **Non-Intrusive Emergency Toast**: Instant floating alert when a new Emergency patient arrives without disrupting the current consultation.
- **End-of-Day Analytics**: Summary of patients seen, average wait time, and average consultation duration.

### 🌐 System Architecture & Quality
- **Native Node.js SQLite (`node:sqlite`)**: High performance, zero native compile dependencies, ACID transactions, and automatic 24-hour database backups.
- **Socket.IO Real-Time Sync**: Instant bidirectional updates across doctor and nurse terminals on the same local Wi-Fi / LAN network.
- **JWT & Role-Based Access Control**: Secure token-based authentication guarding Doctor and Nurse routes.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/ganeshkumarhegde90-code/healthcare-system.git
cd healthcare-system

# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Environment Setup
Create `server/.env` (or copy from `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_clinic_jwt_key_2026_small_clinic_care
CLIENT_ORIGIN=http://localhost:5173
DATABASE_PATH=./data/clinic.db
BACKUP_DIR=./backups
```

### 3. Seed Database with Sample Patients
```bash
cd server
node src/seed.js
cd ..
```

### 4. Run Both Servers
```bash
# Terminal 1: Start Backend Server (port 5000)
cd server
node src/index.js

# Terminal 2: Start Frontend Dev Server (port 5173)
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 🔑 Demo Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Doctor** | `dr.smith` | `doctor123` |
| **Nurse 1** | `nurse.mary` | `nurse123` |
| **Nurse 2** | `nurse.sarah` | `nurse123` |

*(Quick 1-click login buttons are also provided on the login screen for instant testing)*

---

## 📡 Running on Clinic Local Wi-Fi / LAN

The server and frontend bind to `0.0.0.0`, allowing other devices (e.g. nurse tablet, doctor laptop) on the same local network to connect:
- **Tablet / Mobile URL**: `http://<YOUR_LOCAL_IP>:5173` (e.g. `http://192.168.1.100:5173`)

---

## 🛠 Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Three.js (Bio-Sphere animation), Socket.IO Client.
- **Backend**: Node.js, Express, SQLite (`node:sqlite`), Socket.IO, JWT, bcryptjs.
