import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isDemoMode, demoFindUserById } from '../services/store.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = isDemoMode() ? demoFindUserById(payload.sub) : await User.findById(payload.sub).select('-passwordHash');
    if (!user) return res.status(401).json({ message: 'User no longer exists.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
}
