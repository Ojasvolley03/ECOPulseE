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
      console.log('Database already initialized with data.');
      return;
    }

    console.log('Seeding initial demo data...');

    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);

    // 1. Users
    await execute(`
      INSERT INTO users (name, email, password_hash, phone, role) VALUES
      ('System Administrator', 'admin@ecopulse.com', ?, '+1 555-0100', 'ADMIN'),
      ('John Driver (Worker)', 'worker1@ecopulse.com', ?, '+1 555-0101', 'WORKER'),
      ('Sarah Miller (Worker)', 'worker2@ecopulse.com', ?, '+1 555-0102', 'WORKER'),
      ('David Vance (Worker)', 'worker3@ecopulse.com', ?, '+1 555-0103', 'WORKER'),
      ('Alice Citizen', 'citizen1@ecopulse.com', ?, '+1 555-0104', 'CITIZEN'),
      ('Bob Resident', 'citizen2@ecopulse.com', ?, '+1 555-0105', 'CITIZEN')
    `, [adminPasswordHash, defaultPasswordHash, defaultPasswordHash, defaultPasswordHash, defaultPasswordHash, defaultPasswordHash]);

    // 2. Waste Bins (Coordinates around city center: 37.7749, -122.4194 - San Francisco center)
    const binsData = [
      { code: 'BIN-101', address: 'Market St & 4th St (Downtown)', lat: 37.7897, lng: -122.4014, fill: 35, type: 'Recyclable', status: 'NORMAL' },
      { code: 'BIN-102', address: 'Civic Center Plaza', lat: 37.7793, lng: -122.4193, fill: 82, type: 'Organic', status: 'NEARLY_FULL' },
      { code: 'BIN-103', address: 'Embarcadero Ferry Terminal', lat: 37.7955, lng: -122.3937, fill: 96, type: 'General', status: 'CRITICAL' },
      { code: 'BIN-104', address: 'Union Square South', lat: 37.7879, lng: -122.4074, fill: 68, type: 'Paper', status: 'MEDIUM' },
      { code: 'BIN-105', address: 'SOMA Tech Center', lat: 37.7785, lng: -122.3965, fill: 18, type: 'Glass', status: 'NORMAL' },
      { code: 'BIN-106', address: 'Fisherman Wharf Gate 2', lat: 37.8080, lng: -122.4177, fill: 94, type: 'Mixed', status: 'CRITICAL' },
      { code: 'BIN-107', address: 'Mission District Plaza', lat: 37.7599, lng: -122.4148, fill: 45, type: 'Hazardous', status: 'NORMAL' },
      { code: 'BIN-108', address: 'Golden Gate Park East Entry', lat: 37.7712, lng: -122.4580, fill: 73, type: 'Organic', status: 'MEDIUM' },
    ];

    for (const bin of binsData) {
      await execute(`
        INSERT INTO waste_bins (bin_code, address, latitude, longitude, fill_level, waste_type, status, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [bin.code, bin.address, bin.lat, bin.lng, bin.fill, bin.type, bin.status]);
    }

    // 3. Sensor Readings (Historical data for analytics)
    const bins = await query('SELECT id, fill_level FROM waste_bins');
    for (const bin of bins) {
      // Add 5 historical readings per bin over the past 24 hours
      for (let i = 4; i >= 0; i--) {
        const fillVariation = Math.max(5, Math.min(100, bin.fill_level - (i * 15) + Math.floor(Math.random() * 8)));
        const temp = 22 + Math.floor(Math.random() * 8);
        const battery = 98 - (i * 2);
        await execute(`
          INSERT INTO sensor_readings (bin_id, fill_level, temperature, battery_level, reading_time)
          VALUES (?, ?, ?, ?, datetime('now', '-${i * 3} hours'))
        `, [bin.id, fillVariation, temp, battery]);
      }
    }

    // 4. Complaints
    const citizen1 = await queryOne("SELECT id FROM users WHERE email = 'citizen1@ecopulse.com'");
    const citizen2 = await queryOne("SELECT id FROM users WHERE email = 'citizen2@ecopulse.com'");
    const bin103 = await queryOne("SELECT id FROM waste_bins WHERE bin_code = 'BIN-103'");
    const bin106 = await queryOne("SELECT id FROM waste_bins WHERE bin_code = 'BIN-106'");
    const bin102 = await queryOne("SELECT id FROM waste_bins WHERE bin_code = 'BIN-102'");

    if (citizen1 && bin103) {
      await execute(`
        INSERT INTO complaints (user_id, bin_id, description, image_url, location_address, latitude, longitude, priority, status)
        VALUES (?, ?, 'Trash bin overflowing onto the sidewalk, creating odor and blocking passage.', 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500', 'Embarcadero Ferry Terminal', 37.7955, -122.3937, 'HIGH', 'IN_PROGRESS')
      `, [citizen1.id, bin103.id]);
    }

    if (citizen2 && bin106) {
      await execute(`
        INSERT INTO complaints (user_id, bin_id, description, image_url, location_address, latitude, longitude, priority, status)
        VALUES (?, ?, 'Severe garbage buildup near tourist zone.', 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=500', 'Fisherman Wharf Gate 2', 37.8080, -122.4177, 'HIGH', 'PENDING')
      `, [citizen2.id, bin106.id]);
    }

    if (citizen1 && bin102) {
      await execute(`
        INSERT INTO complaints (user_id, bin_id, description, image_url, location_address, latitude, longitude, priority, status)
        VALUES (?, ?, 'Cardboard boxes stacked beside full recycle bin.', null, 'Civic Center Plaza', 37.7793, -122.4193, 'MEDIUM', 'RESOLVED')
      `, [citizen1.id, bin102.id]);
    }

    // 5. Collection Tasks
    const worker1 = await queryOne("SELECT id FROM users WHERE email = 'worker1@ecopulse.com'");
    const worker2 = await queryOne("SELECT id FROM users WHERE email = 'worker2@ecopulse.com'");

    if (bin103 && worker1) {
      await execute(`
        INSERT INTO collection_tasks (bin_id, worker_id, priority, status, assignment_time)
        VALUES (?, ?, 'CRITICAL', 'IN_PROGRESS', datetime('now', '-30 minutes'))
      `, [bin103.id, worker1.id]);
    }

    if (bin106 && worker2) {
      await execute(`
        INSERT INTO collection_tasks (bin_id, worker_id, priority, status, assignment_time)
        VALUES (?, ?, 'CRITICAL', 'ASSIGNED', datetime('now', '-10 minutes'))
      `, [bin106.id, worker2.id]);
    }

    if (bin102) {
      await execute(`
        INSERT INTO collection_tasks (bin_id, worker_id, priority, status)
        VALUES (?, NULL, 'HIGH', 'PENDING')
      `, [bin102.id]);
    }

    // 6. Initial Notifications
    await execute(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES 
      (NULL, 'Critical Alert', 'BIN-103 reached 96% critical fill level!', 'CRITICAL_BIN'),
      (NULL, 'Critical Alert', 'BIN-106 reached 94% critical fill level!', 'CRITICAL_BIN'),
      (?, 'Task Assigned', 'Collection task for BIN-103 assigned to you.', 'TASK_ASSIGNED')
    `, [worker1 ? worker1.id : null]);

    console.log('Database initialized and seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}
