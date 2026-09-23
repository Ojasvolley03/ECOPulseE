import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { initDatabaseAndSeed } from './services/seedService.js';
import { initSocketIO } from './services/socketService.js';

import authRoutes from './routes/authRoutes.js';
import binRoutes from './routes/binRoutes.js';
import sensorRoutes from './routes/sensorRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import simulatorRoutes from './routes/simulatorRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import { authLimiter, sensorLimiter, aiLimiter, notificationLimiter } from './middleware/rateLimiters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);
if (allowedOrigins.length === 0) {
  throw new Error('CORS_ORIGINS must be configured in the environment.');
}

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Uploaded Files
const uploadsPath = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// HTTP & Socket Server
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Initialize Socket.IO instance helper
initSocketIO(io);

// Mount API Endpoints
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/bins', binRoutes);
app.use('/api/sensors', sensorLimiter, sensorRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationLimiter, notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// Serve frontend dist build if present
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server and Initialize Database
server.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Smart Waste Management Server running on port ${PORT}`);
  console.log(`📡 REST API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSockets Active`);
  console.log(`=======================================================`);

  await initDatabaseAndSeed();
});
