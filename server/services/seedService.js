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

    // Run schema statements sequentially
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await execute(stmt);
    }

    // Check if database already has users
    const existingUsers = await queryOne('SELECT COUNT(*) as count FROM users');
    if (existingUsers && existingUsers.count > 0) {
      console.log('Database already initialized.');
      return;
    }

    console.log('Initializing empty database with admin user only...');

    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);

    // Create only admin user for system access
    await execute(`
      INSERT INTO users (name, email, password_hash, phone, role) VALUES
      ('System Administrator', 'admin@ecopulse.com', ?, '+1 555-0100', 'ADMIN')
    `, [adminPasswordHash]);

    console.log('Database initialized successfully (no demo data)!');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}
