const admin = require('firebase-admin');

// Service account JSON is stored as a BASE64 string in the
// FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable (never commit the
// raw JSON file to git). See README.md for how to generate it.
if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!raw) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_BASE64 env var');
  }
  const serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = { admin, db };
