const { db } = require('../lib/firebaseAdmin');
const { requireAdmin } = require('../lib/adminAuth');

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const ref = db.collection('config').doc('settings');

  if (req.method === 'GET') {
    const snap = await ref.get();
    const settings = snap.exists ? snap.data() : { mineAmount: 1, cooldownSeconds: 3600 };
    return res.status(200).json(settings);
  }

  if (req.method === 'POST') {
    const { mineAmount, cooldownSeconds } = req.body || {};
    if (typeof mineAmount !== 'number' || typeof cooldownSeconds !== 'number') {
      return res.status(400).json({ error: 'mineAmount and cooldownSeconds must be numbers' });
    }
    await ref.set({ mineAmount, cooldownSeconds }, { merge: true });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
