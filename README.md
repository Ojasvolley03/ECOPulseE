# EcoPulse - Real-Time Smart Waste Collection & Management System

> **EcoPulse** is an enterprise-grade, real-time IoT waste management platform designed for smart cities. It features automated sensor telemetry monitoring, instant critical overflow alerts, citizen complaint reporting with AI visual classification, worker dispatch automation, and real-time interactive mapping.

---

## 🌟 Key Features

1. **Autonomous Bin Logic & Threshold Enforcement**:
   - `0–50%` → **NORMAL**
   - `51–75%` → **MEDIUM**
   - `76–90%` → **NEARLY FULL**
   - `91–100%` → **CRITICAL** (Triggers high-priority collection task auto-generation & immediate real-time WebSocket alert to administrators).

2. **Role-Based Portals**:
   - 🛡️ **Administrator Control Center**: 16 monitoring metrics, real-time critical alert ticker, interactive Leaflet Map with custom color-coded status markers, task dispatch, complaint resolution, and analytics charts.
   - 🚛 **Worker / Collection Driver Portal**: Assigned task queue, location address, fill status, workflow controls (**Accept Task** → **Start Collection** → **Mark Completed** to reset bin to 0%).
   - 🙋 **Citizen Portal**: View nearby dustbins on interactive map, report waste problems with photo upload & AI category classifier, track complaint progress timeline.

3. **Interactive IoT Sensor Simulator**:
   - Built-in telemetry control panel allows manual adjustments of fill levels (0-100%), internal temperature, battery level, or running an automatic background fill simulator.

4. **Modular AI Engine**:
   - **Waste Category Image Classification** (Plastic, Paper, Glass, Metal, Organic, Mixed).
   - **Complaint Urgency & Sentiment Analyzer**.
   - **Machine Learning Fill-Rate Overflow Forecasting** (Predicts which bins will hit critical capacity within 4 hours).

---

## 🔑 Demo Credentials (1-Click Login Available)

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@ecopulse.com` | `password123` | Full System Control, Dashboard, Dispatch, Simulator |
| **Collection Worker** | `worker1@ecopulse.com` | `password123` | Task Queue, Accept/Start/Empty Bins |
| **Citizen** | `citizen1@ecopulse.com` | `password123` | Map lookup, File Complaints, Track Status |

---

## 🚀 Quick Start Instructions

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: package manager

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Backend Server (REST API + WebSockets)
```bash
npm run server
```
*The server initializes the local SQLite database (`waste_management.db`) and seeds initial demo data automatically on port `5000`.*

### 3. Start Frontend Development Server (React + Vite)
In a separate terminal window:
```bash
npm run dev
```
*App will open at `http://localhost:3000`.*

---

## 🏗️ Architecture & Database Schema

- **Database**: SQLite (`waste_management.db`)
- **Backend**: Express.js + Socket.IO + JWT Authentication + Bcryptjs
- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons + Leaflet Maps + Recharts
