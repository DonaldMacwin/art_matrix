const admin = require('firebase-admin');
const path = require('path');

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--dry') opts.dry = true;
  if (a === '--collection' && args[i+1]) { opts.collection = args[i+1]; i++; }
  if (a === '--parentRow' && args[i+1]) { opts.parentRow = args[i+1]; i++; }
  if (a === '--startCol' && args[i+1]) { opts.startCol = args[i+1]; i++; }
  if (a === '--endCol' && args[i+1]) { opts.endCol = args[i+1]; i++; }

  // modalRow は "1" または "1-4" を受け付ける
  if (a === '--modalRow' && args[i+1]) {
    const v = args[i+1]; i++;
    if (v.includes('-')) {
      const [s,e] = v.split('-').map(n => parseInt(n,10));
      opts.modalRowStart = s; opts.modalRowEnd = e;
    } else {
      opts.modalRow = v;
    }
  }

  // modalCol は "1" または "1-4" を受け付ける（通常は1-4）
  if (a === '--modalCol' && args[i+1]) {
    const v = args[i+1]; i++;
    if (v.includes('-')) {
      const [s,e] = v.split('-').map(n => parseInt(n,10));
      opts.modalColStart = s; opts.modalColEnd = e;
    } else {
      opts.modalCol = v;
    }
  }

  // 互換性: 旧オプション名で範囲指定を入れる場合のサポート
  if (a === '--modalRowRange' && args[i+1]) {
    const v = args[i+1]; i++;
    const [s,e] = v.split('-').map(n => parseInt(n,10));
    opts.modalRowStart = s; opts.modalRowEnd = e;
  }
  if (a === '--modalColRange' && args[i+1]) {
    const v = args[i+1]; i++;
    const [s,e] = v.split('-').map(n => parseInt(n,10));
    opts.modalColStart = s; opts.modalColEnd = e;
  }
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

  const parentRow = opts.parentRow ? parseInt(opts.parentRow, 10) : 1;

  const startCol = opts.startCol ? parseInt(opts.startCol, 10) : 15;
  const endCol   = opts.endCol   ? parseInt(opts.endCol, 10)   : 18;

  // modalRow の範囲。デフォルトを 1〜4 に変更（r1〜r4）
  let startModalRow = 1, endModalRow = 4;
  if (opts.modalRowStart !== undefined && opts.modalRowEnd !== undefined) {
    startModalRow = parseInt(opts.modalRowStart,10);
    endModalRow = parseInt(opts.modalRowEnd,10);
  } else if (opts.modalRow !== undefined) {
    startModalRow = endModalRow = parseInt(opts.modalRow,10);
  }

  // modalCol の範囲（デフォルト 1〜4）
  let startModalCol = 1, endModalCol = 4;
  if (opts.modalColStart !== undefined && opts.modalColEnd !== undefined) {
    startModalCol = parseInt(opts.modalColStart,10);
    endModalCol = parseInt(opts.modalColEnd,10);
  } else if (opts.modalCol !== undefined) {
    startModalCol = endModalCol = parseInt(opts.modalCol,10);
  }

  for (let pc = startCol; pc <= endCol; pc++) {
    for (let mr = startModalRow; mr <= endModalRow; mr++) {
      for (let mc = startModalCol; mc <= endModalCol; mc++) {
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