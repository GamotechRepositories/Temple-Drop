import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'temple-drop-csrf-fallback-secret-2026';
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken(sessionId) {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${sessionId}:${timestamp}`)
    .digest('hex');
  return `${timestamp}.${signature}`;
}

export function verifyCsrfToken(token, sessionId) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${sessionId}:${timestamp}`)
    .digest('hex');

  if (signature.length !== expectedSig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
}

export function csrfCookieMiddleware(req, res, next) {
  const sessionToken = req.cookies['td_session'] || 'anonymous';
  const existingCsrf = req.cookies[CSRF_COOKIE_NAME];

  if (!existingCsrf || !verifyCsrfToken(existingCsrf, sessionToken)) {
    const newToken = generateCsrfToken(sessionToken);
    res.cookie(CSRF_COOKIE_NAME, newToken, {
      httpOnly: false,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/',
    });
  }
  next();
}

export function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  if (
    req.path === '/api/auth/login' ||
    req.path === '/api/auth/register' ||
    req.path === '/api/auth/guest'
  ) {
    return next();
  }

  const sessionToken = req.cookies['td_session'] || 'anonymous';
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!headerToken || !verifyCsrfToken(headerToken, sessionToken)) {
    res.status(403).json({ error: 'Invalid or missing CSRF token' });
    return;
  }

  next();
}
