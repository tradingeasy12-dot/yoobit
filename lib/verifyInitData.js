const crypto = require('crypto');

/**
 * Verifies Telegram Mini App initData according to the official algorithm:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * This MUST run on the server only. Never trust initData that hasn't been
 * verified here — anyone can send a fake "user" object from the browser
 * console otherwise.
 */
function verifyTelegramInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckArr = [];
  const keys = Array.from(params.keys()).sort();
  for (const key of keys) {
    dataCheckArr.push(`${key}=${params.get(key)}`);
  }
  const dataCheckString = dataCheckArr.join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // timing-safe compare
  const a = Buffer.from(calculatedHash, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  const authDate = parseInt(params.get('auth_date'), 10);
  const now = Math.floor(Date.now() / 1000);
  if (!authDate || now - authDate > maxAgeSeconds) {
    return null; // expired initData, force re-open from Telegram
  }

  const userStr = params.get('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (!user || !user.id) return null;

  return { user, authDate };
}

module.exports = { verifyTelegramInitData };
