const admin = require('firebase-admin');
const path = require('path');

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry') opts.dry = true;
  if (args[i] === '--collection' && args[i+1]) { opts.collection = args[i+1]; i++; }
}

// 設定: サービスアカウント鍵のパスとデフォルトコレクション
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const COLLECTION_NAME = opts.collection || 'details';

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (err) {
  console.error('サービスアカウント鍵が見つからないか読み込みに失敗しました:', serviceAccountPath);
  console.error('エラー:', err.message);
  process.exit(1);
}

const db = admin.firestore();

function makeId(parentRow, parentCol, modalRow, modalCol) {
  return `R${parentRow}C${parentCol}-r${modalRow}c${modalCol}`;
}

async function main() {
  const toDelete = [];
  const parentRow = 1;
  for (let pc = 15; pc <= 18; pc++) {
    for (let mr = 2; mr <= 4; mr++) {
      for (let mc = 1; mc <= 4; mc++) {
        toDelete.push(makeId(parentRow, pc, mr, mc));
      }
    }
  }

  console.log(`対象件数: ${toDelete.length}`);
  if (opts.dry) {
    console.log('--- DRY RUN: 削除予定 ID ---');
    toDelete.forEach(id => console.log(id));
    process.exit(0);
  }

  let success = 0, fail = 0;
  for (const id of toDelete) {
    try {
      await db.collection(COLLECTION_NAME).doc(id).delete();
      console.log('deleted:', id);
      success++;
    } catch (err) {
      console.error('failed:', id, err.message);
      fail++;
    }
  }

  console.log(`完了: 成功 ${success} 件, 失敗 ${fail} 件`);
  process.exit(0);
}

main().catch(err => {
  console.error('実行エラー:', err.message);
  process.exit(1);
});