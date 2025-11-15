import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const detailPath = path.join(__dirname, '..', 'data', 'detail.json');

function loadJson(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

function makeId(parentRow, parentCol, modalRow, modalCol) {
  return `R${parentRow}C${parentCol}-r${modalRow}c${modalCol}`;
}

function generateEntries(existing, parentRowStart = 2, parentRowEnd = 18, parentColStart = 1, parentColEnd = 14) {
  const existingIds = new Set(existing.map(e => e.id));
  const out = [];
  for (let pr = parentRowStart; pr <= parentRowEnd; pr++) {
    for (let pc = parentColStart; pc <= parentColEnd; pc++) {
      for (let mr = 1; mr <= 4; mr++) {
        for (let mc = 1; mc <= 4; mc++) {
          const id = makeId(pr, pc, mr, mc);
          if (existingIds.has(id)) continue;
          out.push({
            id,
            parentRow: pr,
            parentCol: pc,
            modalRow: mr,
            modalCol: mc,
            title: "テスト作品",
            author: "テスト作家",
            year: "2025",
            description: "これはテストデータです\n",
            imageUrl: "",
            tags: ["油彩"]
          });
        }
      }
    }
  }
  return out;
}

try {
  const data = loadJson(detailPath);
  if (!Array.isArray(data)) {
    console.error('detail.json は配列ではありません。');
    process.exit(1);
  }

  const additions = generateEntries(data); // デフォルト範囲を使用
  if (additions.length === 0) {
    console.log('追加するエントリはありません。');
    process.exit(0);
  }

  const merged = data.concat(additions);
  saveJson(detailPath, merged);

  console.log(`追加エントリ: ${additions.length} 件。detail.json を更新しました。`);
} catch (err) {
  console.error('エラー:', err.message);
  process.exit(1);
}