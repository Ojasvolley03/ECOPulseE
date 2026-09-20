import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, execute } from '../config/db.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';

export async function register(req, res) {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (role === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin accounts can only be created during first-run setup.' });
    }

    const assignedRole = ['CITIZEN', 'WORKER'].includes(role) ? role : 'CITIZEN';

    const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await execute(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, phone || '', assignedRole]
    );

    const user = { id: result.lastID, name, email, role: assignedRole };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
}

export async function getAdminStatus(req, res) {
  try {
    const admin = await queryOne("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
    res.json({ success: true, setupRequired: !admin });
  } catch (err) {
    console.error('Admin status error:', err);
    res.status(500).json({ success: false, message: 'Server error checking admin setup.' });
  }
}

export async function setupAdmin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const existingAdmin = await queryOne("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
    if (existingAdmin) {
      return res.status(409).json({ success: false, message: 'Admin setup is already complete. Please sign in.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const normalizedEmail = email.trim().toLowerCase();
    const result = await execute(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      ['System Administrator', normalizedEmail, passwordHash, '', 'ADMIN']
    );
    const user = { id: result.lastID, name: 'System Administrator', email: normalizedEmail, role: 'ADMIN', phone: '' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ success: true, message: 'Admin Portal is ready.', token, user });
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint failed: users.email')) {
      return res.status(409).json({ success: false, message: 'That email is already in use.' });
    }
    console.error('Admin setup error:', err);
    res.status(500).json({ success: false, message: 'Server error during admin setup.' });
  }
}

export async function changeAdminCredentials(req, res) {
  try {
    const { currentPassword, email, newPassword } = req.body;
    if (!currentPassword || !email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password, email, and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const admin = await queryOne("SELECT * FROM users WHERE id = ? AND role = 'ADMIN'", [req.user.id]);
    if (!admin || !(await bcrypt.compare(currentPassword, admin.password_hash))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const normalizedEmail = email.trim().toLowerCase();
    await execute('UPDATE users SET email = ?, password_hash = ? WHERE id = ?', [normalizedEmail, passwordHash, admin.id]);

    const user = { id: admin.id, name: admin.name, email: normalizedEmail, role: 'ADMIN', phone: admin.phone || '' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: 'Admin credentials updated.', token, user });
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint failed: users.email')) {
      return res.status(409).json({ success: false, message: 'That email is already in use.' });
    }
    console.error('Admin credentials error:', err);
    res.status(500).json({ success: false, message: 'Server error updating admin credentials.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userPayload = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

export async function getMe(req, res) {
  try {
    const user = await queryOne('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving profile.' });
  }
}
