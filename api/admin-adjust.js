const { db, admin } = require('../lib/firebaseAdmin');
const { requireAdmin } = require('../lib/adminAuth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const { userId, amount, reason } = req.body || {};
    if (!userId || typeof amount !== 'number') {
      return res.status(400).json({ error: 'userId and numeric amount are required' });
    }

    const userRef = db.collection('users').doc(String(userId));
    const doc = await userRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });

    await userRef.update({
      balance: admin.firestore.FieldValue.increment(amount),
    });

    await db.collection('adjustments').add({
      userId: String(userId),
      amount,
      reason: reason || '',
      createdAt: Date.now(),
    });

    const updated = await userRef.get();
    res.status(200).json({ balance: updated.data().balance });
  } catch (err) {
    console.error('admin-adjust error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
