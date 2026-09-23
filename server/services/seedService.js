import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, queryOne, execute, db } from '../config/db.js';
import { reconcileWorkerAlerts } from './workerAlertService.js';

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

    const binColumns = await query('PRAGMA table_info(waste_bins)');
    const binFieldNames = new Set((binColumns || []).map(col => col.name));
    if (!binFieldNames.has('alert_active')) {
      await execute('ALTER TABLE waste_bins ADD COLUMN alert_active INTEGER NOT NULL DEFAULT 0');
    }

    const legacyAdmin = await queryOne("SELECT id, password_hash FROM users WHERE email = 'admin@ecopulse.com' AND role = 'ADMIN'");
    if (legacyAdmin && await bcrypt.compare('admin123', legacyAdmin.password_hash)) {
      await execute('DELETE FROM users WHERE id = ?', [legacyAdmin.id]);
      console.log('Removed the legacy demo admin so first-run setup can be completed.');
    }

    const existingUsers = await queryOne('SELECT COUNT(*) as count FROM users');
    const demoUsers = [
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
    await reconcileWorkerAlerts();
    console.log('Worker dustbin alert monitoring is active.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}
