import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/authMiddleware.js';

let ioInstance = null;

export function initSocketIO(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const user = jwt.verify(token, JWT_SECRET);
        socket.user = user;
        socket.join(`role:${user.role}`);
        socket.join(`user:${user.id}`);
        console.log(`🔌 WebSockets: Authenticated client connected (${socket.id}) for role ${user.role}`);
      } catch (err) {
        console.warn('⚠️ Invalid socket auth token rejected:', err.message);
      }
    } else {
      console.log(`🔌 WebSockets: Client connected (${socket.id}) without auth`);
    }

    socket.on('disconnect', () => {
      console.log(`🔌 WebSockets: Client disconnected (${socket.id})`);
    });
  });
}

export function getSocketIO() {
  return ioInstance;
}

export function emitToRole(role, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`role:${role}`).emit(event, payload);
}

export function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}
