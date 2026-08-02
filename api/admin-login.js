const { createAdminToken } = require('../lib/adminAuth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    // Small delay to slow down brute-force guessing
    await new Promise((r) => setTimeout(r, 500));
    return res.status(401).json({ error: 'Wrong password' });
  }

  res.status(200).json({ token: createAdminToken() });
};
