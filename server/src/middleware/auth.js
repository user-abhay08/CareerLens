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
    req.user = { id: user._id.toString(), name: user.name, email: user.email };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      err.statusCode = 401;
      err.message = 'Session invalid or expired — please log in again';
    }
    next(err);
  }
}
