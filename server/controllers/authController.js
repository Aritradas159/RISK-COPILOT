import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isDemoMode, demoFindUserByEmail, demoFindUserById, demoCreateUser } from '../services/store.js';

function issueCookie(res, userId) {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export async function signup(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  const normalized = email.toLowerCase().trim();
  const exists = isDemoMode() ? demoFindUserByEmail(normalized) : await User.findOne({ email: normalized });
  if (exists) return res.status(409).json({ message: 'An account with this email already exists.' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = isDemoMode() ? demoCreateUser({ name: name.trim(), email: normalized, passwordHash, preferredLanguage: 'en' }) : await User.create({ name: name.trim(), email: normalized, passwordHash });
  issueCookie(res, user.id || user._id);
  res.status(201).json({ user: { id: user.id || user._id, name: user.name, email: user.email, preferredLanguage: user.preferredLanguage } });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = isDemoMode() ? demoFindUserByEmail(email?.toLowerCase().trim()) : await User.findOne({ email: email?.toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  issueCookie(res, user.id || user._id);
  res.json({ user: { id: user.id || user._id, name: user.name, email: user.email, preferredLanguage: user.preferredLanguage } });
}

export function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out.' });
}

export function me(req, res) {
  res.json({ user: { id: req.user.id || req.user._id, name: req.user.name, email: req.user.email, preferredLanguage: req.user.preferredLanguage } });
}
