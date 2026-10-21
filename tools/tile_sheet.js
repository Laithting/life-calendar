// 檢查磁磚圖案並輸出總覽圖：node tools/tile_sheet.js [輸出檔]
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
require(path.join(__dirname, '..', 'docs', 'tiles.js'));
const T = globalThis.LCTiles;

let bad = 0;
for (const [k, m] of Object.entries(T.MOTIFS)) {
  const w = m.art[0].length;
  m.art.forEach((row, i) => { if (row.length !== w) { console.log(`✗ ${k} 第 ${i} 列長度 ${row.length}，應為 ${w}`); bad++; } });
  if (m.art.length > 16 || w > 16) { console.log(`✗ ${k} 超過 16×16`); bad++; }
  const roles = new Set(m.art.join('').replace(/\./g, ''));
  for (const r of roles) if (!(r in m.colors) && r !== 'k' && r !== 'w' && r !== 'a') console.log(`! ${k} 角色 ${r} 沒有指定顏色`);
}
console.log(bad ? `${bad} 個問題` : `${Object.keys(T.MOTIFS).length} 個圖案格式正確`);

const texts = [
  '和老朋友聊到半夜', '第一次自己做出好吃的咖哩', '週末去山上走了一圈', '終於把拖很久的報告交出去',
  '跟家人視訊了一個小時', '在書店待了整個下午', '學會了一首新歌', '早起看了日出',
  '去海邊游泳', '媽媽生日吃蛋糕', '下雨天在家看電影', '沒什麼特別的一週',
  '腳踏車', '週末騎腳踏車去河濱', '開車去兜風', '搭高鐵回家'
];
const tiles = [];
Object.keys(T.MOTIFS).forEach(k => tiles.push(T.motifPreview(k)));
while (tiles.length % 8) tiles.push(T.blank(1));
texts.forEach(t => { for (let n = 0; n < 4; n++) tiles.push(T.generate(t, n)); });
for (const a of tiles) if (a.length !== 256 || a.some(v => !(v >= 0 && v <= 9))) { console.log('✗ 生成結果不合法'); process.exit(1); }

const scale = 6, gap = 6, cols = 8, rows = Math.ceil(tiles.length / cols);
const W = cols * (16 * scale + gap) + gap, H = rows * (16 * scale + gap) + gap;
const pal = T.PALETTE.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
const px = Buffer.alloc(W * H * 3, 60);
tiles.forEach((art, t) => {
  const ox = gap + (t % cols) * (16 * scale + gap), oy = gap + Math.floor(t / cols) * (16 * scale + gap);
  art.forEach((v, i) => {
    const c = pal[v];
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const o = ((oy + Math.floor(i / 16) * scale + dy) * W + ox + (i % 16) * scale + dx) * 3;
      px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
    }
  });
});
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3); }
const crc = b => { let c, n = -1; for (const x of b) { c = (n ^ x) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; n = (n >>> 8) ^ c; } return (n ^ -1) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
const out = process.argv[2] || 'tile_sheet.png';
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote', out, `${tiles.length} tiles`);
texts.forEach(t => console.log(t, '→', T.findMotifs(t).join(', ') || '(抽象)'));
