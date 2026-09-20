import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, queryOne, execute, db } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDatabaseAndSeed() {
  try {
    const schemaPath = path.resolve(__dirname, '../config/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await execute(stmt);
    }

    const complaintColumns = await query('PRAGMA table_info(complaints)');
    const complaintFieldNames = new Set((complaintColumns || []).map(col => col.name));

    if (!complaintFieldNames.has('citizen_name')) {
      await execute('ALTER TABLE complaints ADD COLUMN citizen_name TEXT');
    }
    if (!complaintFieldNames.has('citizen_phone')) {
      await execute('ALTER TABLE complaints ADD COLUMN citizen_phone TEXT');
    }

    const existingUsers = await queryOne('SELECT COUNT(*) as count FROM users');
    const demoUsers = [
      { name: 'System Administrator', email: 'admin@ecopulse.com', password: 'admin123', phone: '+1 555-0100', role: 'ADMIN' },
      { name: 'Collection Worker', email: 'worker1@ecopulse.com', password: 'password123', phone: '+1 555-0110', role: 'WORKER' },
      { name: 'Citizen User', email: 'citizen1@ecopulse.com', password: 'password123', phone: '+1 555-0120', role: 'CITIZEN' }
    ];

    if (existingUsers && existingUsers.count > 0) {
      console.log('Database already initialized. Verifying seed users and schema...');
    } else {
      console.log('Initializing demo users for admin, worker, and citizen roles...');
    }

    const salt = await bcrypt.genSalt(10);

    for (const user of demoUsers) {
      const existing = await queryOne('SELECT id FROM users WHERE email = ?', [user.email]);
      if (!existing) {
        const passwordHash = await bcrypt.hash(user.password, salt);
        await execute(
          'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
          [user.name, user.email, passwordHash, user.phone, user.role]
        );
      }
    }

    console.log('Database verification complete.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}
