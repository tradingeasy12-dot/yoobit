const { verifyTelegramInitData } = require('../lib/verifyInitData');
const { db } = require('../lib/firebaseAdmin');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { initData } = req.body || {};
    const result = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
    if (!result) return res.status(401).json({ error: 'Invalid or expired session, reopen the app from Telegram' });

    const { user } = result;
    const userId = String(user.id);
    const userRef = db.collection('users').doc(userId);

    const settingsSnap = await db.collection('config').doc('settings').get();
    const settings = settingsSnap.exists
      ? settingsSnap.data()
      : { mineAmount: 1, cooldownSeconds: 3600 };

    const doc = await userRef.get();
    let userData;
    if (!doc.exists) {
      userData = {
        balance: 0,
        totalMined: 0,
        lastMineAt: 0,
        username: user.username || '',
        firstName: user.first_name || '',
        createdAt: Date.now(),
      };
      await userRef.set(userData);
    } else {
      userData = doc.data();
    }

    const now = Date.now();
    const cooldownRemaining = Math.max(
      0,
      userData.lastMineAt + settings.cooldownSeconds * 1000 - now
    );

    res.status(200).json({
      balance: userData.balance,
      totalMined: userData.totalMined,
      cooldownRemaining,
      mineAmount: settings.mineAmount,
      cooldownSeconds: settings.cooldownSeconds,
      displayName: userData.firstName || userData.username || 'Miner',
    });
  } catch (err) {
    console.error('verify error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
