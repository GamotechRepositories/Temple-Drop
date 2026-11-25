import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { WalletLedger } from '../models/WalletLedger.js';
import { Session } from '../models/Session.js';
import { GameState } from '../models/GameState.js';
import {
  createSession,
  requireAuth,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { GAME_CONFIG } from '@temple-drop/shared';

const router = Router();
router.use(authRateLimiter);

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Valid email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      email: normalizedEmail,
      passwordHash,
      isGuest: false,
    });
    await user.save();

    const wallet = new Wallet({
      userId: user._id,
      balanceCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
      initialCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
    });
    await wallet.save();

    const ledger = new WalletLedger({
      userId: user._id,
      type: 'INITIAL',
      amountCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
      balanceAfterCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
      description: 'Initial welcome demo credits',
    });
    await ledger.save();

    await GameState.create({
      userId: user._id,
      spinPoints: 0,
      energyPoints: 0,
    });

    const session = await createSession(user._id);
    res.cookie(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS,
      path: '/',
    });

    res.status(201).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        isGuest: user.isGuest,
        avatarId: user.avatarId,
        preferences: user.preferences,
        createdAt: user.createdAt.toISOString(),
      },
      wallet: {
        balanceCents: wallet.balanceCents,
        initialCents: wallet.initialCents,
        version: wallet.version,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    let wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        balanceCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
        initialCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
      });
    }

    const session = await createSession(user._id);
    res.cookie(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS,
      path: '/',
    });

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        isGuest: user.isGuest,
        avatarId: user.avatarId,
        preferences: user.preferences,
        createdAt: user.createdAt.toISOString(),
      },
      wallet: {
        balanceCents: wallet.balanceCents,
        initialCents: wallet.initialCents,
        version: wallet.version,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/guest', async (req, res, next) => {
  try {
    const randomGuestId = crypto.randomBytes(4).toString('hex');
    const guestEmail = `explorer_${randomGuestId}@templedrop.local`;

    const user = new User({
      email: guestEmail,
      isGuest: true,
      avatarId: 'explorer',
    });
    await user.save();

    const wallet = new Wallet({
      userId: user._id,
      balanceCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
      initialCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
    });
    await wallet.save();

    const ledger = new WalletLedger({
      userId: user._id,
      type: 'INITIAL',
      amountCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
      balanceAfterCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
      description: 'Demo explorer initial credits',
    });
    await ledger.save();

    await GameState.create({
      userId: user._id,
      spinPoints: 0,
      energyPoints: 0,
    });

    const session = await createSession(user._id);
    res.cookie(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS,
      path: '/',
    });

    res.status(201).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        isGuest: user.isGuest,
        avatarId: user.avatarId,
        preferences: user.preferences,
        createdAt: user.createdAt.toISOString(),
      },
      wallet: {
        balanceCents: wallet.balanceCents,
        initialCents: wallet.initialCents,
        version: wallet.version,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies[SESSION_COOKIE_NAME];
    if (token) {
      await Session.deleteOne({ token });
    }
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.json({ message: 'Successfully logged out' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    let wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        balanceCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
        initialCents: GAME_CONFIG.INITIAL_BALANCE_CENTS,
      });
    }

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        isGuest: user.isGuest,
        avatarId: user.avatarId,
        preferences: user.preferences,
        createdAt: user.createdAt.toISOString(),
      },
      wallet: {
        balanceCents: wallet.balanceCents,
        initialCents: wallet.initialCents,
        version: wallet.version,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
