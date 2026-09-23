import rateLimit from 'express-rate-limit';

const standardOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
};

export const authLimiter = rateLimit({ ...standardOptions, windowMs: 15 * 60 * 1000, limit: 20 });
export const sensorLimiter = rateLimit({ ...standardOptions, windowMs: 60 * 1000, limit: 120 });
export const aiLimiter = rateLimit({ ...standardOptions, windowMs: 60 * 1000, limit: 30 });
export const notificationLimiter = rateLimit({ ...standardOptions, windowMs: 60 * 1000, limit: 60 });