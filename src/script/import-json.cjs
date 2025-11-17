// scripts/import-json.cjs (CommonJS)
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Key path: prefer env var GOOGLE_APPLICATION_CREDENTIALS, else fallback to src/serviceAccountKey.json
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : path.resolve(__dirname, '..', 'serviceAccountKey.json');
// Default data file (adjusted to your repo): src/data/detail.json
const filePath = process.argv[2] || path.resolve(__dirname, '..', 'data', 'detail.json');
const collection = process.argv[3] || 'details';

if (!fs.existsSync(keyPath)) {
  console.error('Service account key not found at:', keyPath);
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS env var or place serviceAccountKey.json at src/');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(keyPath)),
});

const db = admin.firestore();

(async () => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  if (Array.isArray(data)) {
    for (const item of data) {
      const id = item.id || item.slug || `${item.parentRow || 'p'}-${item.parentCol || 'q'}-${item.modalRow || 'r'}-${item.modalCol || 's'}`;
      const toWrite = { ...item };
      delete toWrite.id;
      await db.collection(collection).doc(id).set(toWrite);
      console.log('wrote', id);
    }
  } else {
    for (const [id, doc] of Object.entries(data)) {
      await db.collection(collection).doc(id).set(doc);
      console.log('wrote', id);
    }
  }

  console.log('import complete');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
