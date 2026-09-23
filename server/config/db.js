import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../waste_management.db');

// Connect to SQLite Database
const verboseSqlite = sqlite3.verbose();
export const db = new verboseSqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Enable foreign key constraints
db.run('PRAGMA foreign_keys = ON;');

// Promisify database operations for async/await usage
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const queryOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const execute = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export async function withTransaction(work) {
  await execute('BEGIN IMMEDIATE');
  try {
    const result = await work();
    await execute('COMMIT');
    return result;
  } catch (error) {
    try {
      await execute('ROLLBACK');
    } catch (rollbackError) {
      console.error('Database rollback failed:', rollbackError);
    }
    throw error;
  }
}
