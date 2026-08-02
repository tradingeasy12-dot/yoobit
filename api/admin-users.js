const { db } = require('../lib/firebaseAdmin');
const { requireAdmin } = require('../lib/adminAuth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const search = (req.query.search || '').trim();

    let query = db.collection('users').orderBy('balance', 'desc').limit(limit);

    const snap = await query.get();
    let users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (search) {
      const s = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.id.includes(s) ||
          (u.username || '').toLowerCase().includes(s) ||
          (u.firstName || '').toLowerCase().includes(s)
      );
    }

    res.status(200).json({ users });
  } catch (err) {
    console.error('admin-users error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
