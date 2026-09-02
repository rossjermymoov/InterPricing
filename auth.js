// Auth helpers: bcrypt password hashing + JWT in an httpOnly cookie.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const COOKIE = 'token';
const hashPassword = (pw) => bcrypt.hash(pw, 10);
const checkPassword = (pw, hash) => bcrypt.compare(pw, hash);

async function signToken(user) {
  const secret = await db.getSecret();
  return jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, secret, { expiresIn: '30d' });
}

async function readToken(req) {
  const t = req.cookies && req.cookies[COOKIE];
  if (!t) return null;
  try {
    const secret = await db.getSecret();
    return jwt.verify(t, secret);
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

async function attachUser(req, _res, next) {
  const payload = await readToken(req);
  req.user = payload || null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

function getUserFromReq(req) {
  return (req && req.user) ? req.user : null;
}

module.exports = { COOKIE, hashPassword, checkPassword, signToken, cookieOptions, attachUser, requireAuth, requireAdmin, getUserFromReq };
