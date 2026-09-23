# EcoPulse

### Smart waste operations for cleaner, more responsive cities

EcoPulse is a real-time waste-management platform for monitoring smart bins, coordinating collections, tracking fleet activity, and giving citizens a simple way to report waste problems.

> **Current release:** working full-stack prototype with automated backend alerts, role-scoped APIs, temporary direct department access, Socket.IO updates, maps, AI integrations, and a local SQLite database.

---

## Open EcoPulse

| Experience | URL |
| --- | --- |
| Main app and splash screen | [http://127.0.0.1:3000/](http://127.0.0.1:3000/) |
| Admin operations dashboard | [http://127.0.0.1:3000/dashboard](http://127.0.0.1:3000/dashboard) |
| Worker collection dashboard | [http://127.0.0.1:3000/collections](http://127.0.0.1:3000/collections) |
| Citizen dashboard | [http://127.0.0.1:3000/citizen](http://127.0.0.1:3000/citizen) |
| Backend health check | [http://localhost:5000/api/health](http://localhost:5000/api/health) |

The app opens each department directly with a temporary role-scoped session. No email or password is required for the current local/demo flow.

---

## What It Does

### Admin operations

- Monitor bin capacity, collection tasks, workers, complaints, and vehicles.
- Add, update, remove, and locate smart dustbins.
- Create and manage collection vehicles.
- Review analytics, maps, route data, and AI predictions.
- Use the sensor simulator for development and demonstrations.

### Worker operations

- View assigned collection tasks and assigned bins only.
- See automatic worker notifications when a bin exceeds **90% capacity**.
- Receive alert details including bin code, fill level, address, GPS coordinates, waste type, and alert time.
- Update task progress and mark collection complete.
- Send foreground GPS position updates when browser location permission is granted.
- View route stops calculated from assigned work.

### Citizen experience

- View smart bins on an interactive map.
- Report sanitation issues and complaints.
- Upload waste images for AI classification.
- Track submitted complaint status.
- Explore bin QR information and public bin details.

---

## Automated Bin Alerts

The backend evaluates every new bin and every sensor/fill-level update.

```text
Fill level <= 90%  -> alert state cleared
Fill level > 90%   -> one worker alert is created
Repeated >90% data -> no duplicate alert
Bin reset <= 90%   -> alert can trigger again later
```

Alert persistence includes:

- `alert_active` per dustbin for deduplication.
- Worker notification record in the database.
- Transactional `outbox_events` record.
- Socket.IO delivery to the Worker Dashboard.
- Startup reconciliation for bins already above the threshold.

The current sensor input is API/simulator-driven. Connecting physical IoT devices requires a secure device-ingestion service such as MQTT or authenticated sensor webhooks.

---

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, Lucide Icons |
| Maps | React Leaflet, OpenStreetMap tiles |
| Charts | Recharts |
| Backend | Node.js, Express, Socket.IO |
| Database | SQLite for local development |
| Authentication | JWT, bcryptjs, role-scoped API access |
| AI | Google Gemini integration with local fallback behavior |
| Uploads | Multer with image size/type limits |
| Testing | Node test runner |

---

## Quick Start

### Requirements

- Node.js 18 or newer
- npm

### Install

```bash
npm install
```

### Configure the backend

Copy `.env.example` to `.env` and set a strong local secret:

```env
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
GEMINI_API_KEY=
```

Never commit `.env` or production secrets.

### Start the API

```bash
npm run server
```

The server initializes the local SQLite schema and starts REST and Socket.IO services on port `5000`.

### Start the frontend

In a second terminal:

```bash
npm run dev
```

Open [http://127.0.0.1:3000/](http://127.0.0.1:3000/).

### Validate the project

```bash
npm test
npm run build
```

The automated test covers worker alert creation, duplicate prevention, reset, and re-alert behavior.

---

## API Protection

The current backend includes:

- Environment-only JWT secret configuration.
- Restricted CORS origins.
- Rate limiting for auth, sensor, AI, and notification endpoints.
- Authentication on sensor, AI, and worker notification APIs.
- Worker scoping for assigned bins, tasks, sensor readings, vehicles, and routes.
- Transactional alert persistence and an outbox foundation.
- API 404 handling that prevents unknown API paths from falling through to the frontend.

---

## Project Structure

```text
server/
  config/          Database schema and connection helpers
  controllers/     HTTP request handlers
  middleware/      Authentication and rate limiting
  routes/          REST API route definitions
  services/        Alerts, sockets, AI, simulation, and seeding
src/
  components/      Shared UI, maps, simulator, and AI widgets
  context/         Authentication and Socket.IO state
  pages/           Admin, Worker, Citizen, public, and auth screens
  services/        Frontend API client
```

---

## Current Limitations

This repository is not yet a production mobile deployment. The following still require additional infrastructure:

- Native background GPS tracking when the app is closed.
- FCM/APNs push notifications for closed/background mobile apps.
- Offline-first local storage, sync queues, and conflict resolution.
- PostgreSQL or another production database with pooling and backups.
- A durable outbox publisher/queue worker.
- Authenticated physical IoT device ingestion and device health monitoring.
- Traffic-aware routing instead of the current distance-based route calculation.
- Production AI model validation instead of fallback heuristics.

The current browser GPS feature works only while the Worker Dashboard is open and permission is granted. The sensor simulator is for development and demonstration, not a physical sensor replacement.

---

## Recent Changes

- Added a centered EcoPulse splash screen using the consistent dustbin brand symbol.
- Unified EcoPulse visual branding and corrected department labels.
- Added automatic worker alerts for dustbins above 90% capacity.
- Added alert deduplication, reset behavior, startup reconciliation, and outbox records.
- Removed visible department sign-in choices and added temporary direct access for local demos.
- Fixed Admin, Worker, and Citizen department data flows.
- Added Worker-only notification display.
- Added worker-scoped bins, tasks, sensor readings, routes, and vehicle access.
- Added secure environment configuration, CORS restrictions, and rate limits.
- Added foreground worker GPS updates.
- Added integration testing for the automated alert lifecycle.

---

## Repository

[github.com/Ojasvolley03/ECOPulseE](https://github.com/Ojasvolley03/ECOPulseE)
