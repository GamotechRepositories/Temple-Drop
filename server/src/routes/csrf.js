import { Router } from 'express';
import { generateCsrfToken } from '../middleware/csrf.js';

const router = Router();

router.get('/', (req, res) => {
  const sessionToken = req.cookies['td_session'] || 'anonymous';
  const csrfToken = generateCsrfToken(sessionToken);

  res.cookie('XSRF-TOKEN', csrfToken, {
    httpOnly: false,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
  });

  res.json({ csrfToken });
});

export default router;
