const { verifyTelegramInitData } = require('../lib/verifyInitData');
const { db, admin } = require('../lib/firebaseAdmin');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { initData } = req.body || {};
    const result = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
    if (!result) return res.status(401).json({ error: 'Invalid or expired session, reopen the app from Telegram' });

    const userId = String(result.user.id);
    const userRef = db.collection('users').doc(userId);
    const settingsSnap = await db.collection('config').doc('settings').get();
    const settings = settingsSnap.exists
      ? settingsSnap.data()
      : { mineAmount: 1, cooldownSeconds: 3600 };

    // Transaction so two rapid taps can't both succeed (no race condition)
    const outcome = await db.runTransaction(async (tx) => {
      const doc = await tx.get(userRef);
      if (!doc.exists) throw new Error('User not found, call /api/verify first');
      const data = doc.data();
      const now = Date.now();
      const readyAt = (data.lastMineAt || 0) + settings.cooldownSeconds * 1000;

      if (now < readyAt) {
        return { ok: false, cooldownRemaining: readyAt - now, balance: data.balance };
      }

      const newBalance = (data.balance || 0) + settings.mineAmount;
      tx.update(userRef, {
        balance: newBalance,
        totalMined: admin.firestore.FieldValue.increment(settings.mineAmount),
        lastMineAt: now,
      });
      return { ok: true, balance: newBalance };
    });

    if (!outcome.ok) {
      return res.status(429).json({
        error: 'Still on cooldown',
        cooldownRemaining: outcome.cooldownRemaining,
        balance: outcome.balance,
      });
    }

    res.status(200).json({
      balance: outcome.balance,
      mined: settings.mineAmount,
      cooldownRemaining: settings.cooldownSeconds * 1000,
    });
  } catch (err) {
    console.error('mine error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
