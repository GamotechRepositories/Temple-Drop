import crypto from 'crypto';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';

export const SESSION_COOKIE_NAME = 'td_session';
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = new Session({
    token,
    userId,
    expiresAt,
  });
  await session.save();
  return session;
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[SESSION_COOKIE_NAME];
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const session = await Session.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!session) {
      res.clearCookie(SESSION_COOKIE_NAME);
      res.status(401).json({ error: 'Session expired or invalid' });
      return;
    }

    const user = await User.findById(session.userId);
    if (!user) {
      res.clearCookie(SESSION_COOKIE_NAME);
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    req.sessionToken = token;
    next();
  } catch (error) {
    next(error);
  }
}
