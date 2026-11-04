import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      const err = new Error('User no longer exists');
      err.statusCode = 401;
      throw err;
    }
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || 'student',
      department: user.department || '',
      college: user.college || '',
    };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      err.statusCode = 401;
      err.message = 'Session invalid or expired — please log in again';
    }
    next(err);
  }
}

/**
 * Role-based access control middleware matching Synopsis Module 1:
 * Supports 'student', 'recruiter', 'placement_coordinator', 'admin'.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      return next(err);
    }
    const currentRole = req.user.role || 'student';
    if (!roles.includes(currentRole) && currentRole !== 'admin') {
      const err = new Error('Access forbidden: insufficient role permissions');
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
}
