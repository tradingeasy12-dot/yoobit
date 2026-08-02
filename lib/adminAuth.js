const crypto = require('crypto');

function createAdminToken() {
  const expires = Date.now() + 1000 * 60 * 60 * 12; // 12 hour session
  const payload = `${expires}`;
  const sig = crypto
    .createHmac('sha256', process.env.ADMIN_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64');
}

function verifyAdminToken(token) {
  try {
    if (!token) return false;
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [payload, sig] = decoded.split('.');
    const expected = crypto
      .createHmac('sha256', process.env.ADMIN_SECRET)
      .update(payload)
      .digest('hex');
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    if (Date.now() > parseInt(payload, 10)) return false; // expired
    return true;
  } catch {
    return false;
  }
}

function requireAdmin(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = { createAdminToken, verifyAdminToken, requireAdmin };
