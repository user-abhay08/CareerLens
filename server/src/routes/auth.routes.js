import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import env from '../config/env.js';
import { verifySocialToken, unusablePasswordHash } from '../services/oauth.service.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.jwtSecret, { expiresIn: '7d' });
}

/** Which social providers have credentials configured (public info). */
router.get('/oauth-config', (_req, res) => {
  res.json({
    google: Boolean(env.googleClientId),
    googleClientId: env.googleClientId || null,
    apple: Boolean(env.appleClientId),
  });
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: signToken(user), user: user.toPublic() });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }
    res.json({ token: signToken(user), user: user.toPublic() });
  } catch (err) {
    next(err);
  }
});

/**
 * Social sign-in (Google / Apple). Body: { provider, token }.
 * Verifies the provider's identity token, then finds or creates the local
 * user and issues our own session JWT.
 */
router.post('/social', async (req, res, next) => {
  try {
    const { provider, token } = z
      .object({ provider: z.enum(['google', 'apple']), token: z.string().min(10) })
      .parse(req.body);

    const configured = provider === 'google' ? Boolean(env.googleClientId) : Boolean(env.appleClientId);
    if (!configured) {
      const err = new Error(
        provider === 'google'
          ? 'Google sign-in is not configured yet — add GOOGLE_CLIENT_ID to server/.env'
          : 'Apple sign-in is not configured yet — add APPLE_CLIENT_ID to server/.env'
      );
      err.statusCode = 501;
      throw err;
    }

    const profile = await verifySocialToken(provider, token);
    let user = await User.findOne({ email: profile.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: profile.name,
        email: profile.email,
        passwordHash: unusablePasswordHash(),
      });
    }
    res.json({ token: signToken(user), user: user.toPublic() });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 401;
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
