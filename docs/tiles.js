/* 一生日歷 · 磁磚引擎
 * 每塊磁磚是 16×16 的像素圖，每個像素是 10 色調色盤裡的一種顏色。
 * 資料格式：256 個字元的字串，每個字元是 '0'–'9'，代表調色盤的編號。
 * generate(text, n)：從文字裡找關鍵字，挑出對應的圖案，再配上背景與點綴；n 不同就換一種構圖。
 */
(function (root) {
  'use strict';
  const S = 16, N = S * S;
  const PALETTE = ['#FBF8F1', '#23263A', '#E2483D', '#F28C28', '#F6C945', '#4DAA68', '#3D7DD8', '#8E5CC9', '#F29BB9', '#8B5A3C'];
  const NAMES = {
    zh: ['白', '黑', '紅', '橙', '黃', '綠', '藍', '紫', '粉', '棕'],
    en: ['White', 'Black', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'Brown']
  };
  const W = 0, K = 1, R = 2, O = 3, Y = 4, G = 5, B = 6, P = 7, PK = 8, BR = 9;

  /* ---------- 圖案 ----------
   * 角色：a 主色、b 第二色、c 點綴、d 細節、w 亮部、k 輪廓、. 透明
   */
  const MOTIFS = {
    sun: {
      zh: '太陽', en: 'Sun', colors: { a: Y, b: O, c: O, w: W }, alt: [{ a: O, b: R, c: R }],
      kw: ['太陽', '日出', '晴', '早起', '早晨', '早上', '陽光', '夏', 'sun', 'sunrise', 'morning', 'summer'],
      art: ['....b..b....', '.b........b.', '....aaaa....', '...awaaa....', 'b.aawaaaaa.b', '..aaaaaaaa..',
        '..aaaaaaac..', 'b.aaaaaacc.b', '...aaaacc...', '....accc....', '.b........b.', '....b..b....']
    },
    moon: {
      zh: '月亮', en: 'Moon', colors: { a: Y, c: W }, alt: [{ a: W, c: Y }],
      kw: ['月亮', '月光', '夜', '晚上', '睡', '星空', '熬夜', '失眠', 'moon', 'night', 'sleep'],
      art: ['.....aaa..c.', '...aaa......', '..aaa.......', '.aaa......c.', '.aaa........', 'aaaa........',
        'aaaa........', 'aaaa......c.', '.aaaa.......', '.aaaaa....a.', '..aaaaaaaaa.', '....aaaaa...']
    },
    mountain: {
      zh: '山', en: 'Mountains', colors: { a: G, b: B, w: W }, alt: [{ a: B, b: P }, { a: P, b: B }],
      kw: ['爬山', '登山', '健行', '露營', '山', 'hike', 'hiking', 'mountain', 'climb', 'camping'],
      art: ['....w.......', '...www......', '..awwwa.....', '.aaaaaaa.w..', 'aaaaaaaaawb.', 'aaaaaaaaaabb',
        'aaaaaaaaaaab', 'aaaaaaaaaaaa']
    },
    sea: {
      zh: '海浪', en: 'Waves', colors: { a: B, b: W, w: W }, alt: [{ a: P, b: W }],
      kw: ['海', '游泳', '沙灘', '衝浪', '潛水', '湖', '河', 'sea', 'beach', 'swim', 'ocean', 'surf', 'lake', 'river'],
      art: ['..ww....ww..', '.waaw..waaw.', 'waaaawwaaaaw', 'aaaaaaaaaaaa', '..bb....bb..', '.baab..baab.',
        'baaaabbaaaab', 'aaaaaaaaaaaa', 'aaaaaaaaaaaa']
    },
    tree: {
      zh: '樹', en: 'Tree', colors: { a: G, b: BR, c: Y }, alt: [{ a: O, b: BR, c: Y }, { a: PK, b: BR, c: W }],
      kw: ['樹', '公園', '森林', '散步', '自然', '野餐', 'tree', 'park', 'forest', 'walk', 'picnic', 'nature'],
      art: ['....aaaa....', '..aaaaaaaa..', '.aaaacaaaaa.', '.aaacaaaaaa.', 'aaaaaaaaaaaa', 'aaaaaaaaaaaa',
        '.aaaaaaaaaa.', '..aaaaaaaa..', '.....bb.....', '.....bb.....', '.....bb.....', '....bbbb....']
    },
    flower: {
      zh: '花', en: 'Flower', colors: { a: PK, b: G, c: Y }, alt: [{ a: R }, { a: P }, { a: O, c: R }],
      kw: ['花', '植物', '春', '園藝', '盆栽', 'flower', 'plant', 'garden', 'spring', 'bloom'],
      art: ['....aaaa....', '...aaaaaa...', '.aa.aaaa.aa.', 'aaaa.cc.aaaa', 'aaaaccccaaaa', 'aaaaccccaaaa',
        'aaaa.cc.aaaa', '.aa.aaaa.aa.', '...aaaaaa...', '....aaaa....', '.....bb.....', '...b.bb.b...', '....bbbb....']
    },
    heart: {
      zh: '愛心', en: 'Heart', colors: { a: R, c: PK }, alt: [{ a: PK, c: W }, { a: P, c: PK }],
      kw: ['愛', '喜歡', '約會', '感謝', '感恩', '告白', '戀', '結婚', '溫暖', 'love', 'date', 'thank', 'grateful', 'wedding'],
      art: ['.aaa....aaa.', 'aaaaa..aaaaa', 'aacaaaaaaaaa', 'accaaaaaaaaa', 'aaaaaaaaaaaa', '.aaaaaaaaaa.',
        '..aaaaaaaa..', '...aaaaaa...', '....aaaa....', '.....aa.....']
    },
    cup: {
      zh: '咖啡杯', en: 'Cup', colors: { a: R, b: BR, c: W, d: W, w: W, k: K }, alt: [{ a: B }, { a: G }, { a: Y }],
      kw: ['咖啡', '茶', '下午茶', '拿鐵', '奶茶', 'coffee', 'tea', 'cafe', 'latte'],
      art: ['..d..d......', '...d..d.....', '..d..d......', '.kbbbbbbk...', '.kaaaaaakkk.', '.kawaaaak.k.',
        '.kawaaaak.k.', '.kaaaaaakkk.', '..kaaaak....', 'kcccccccccck']
    },
    bowl: {
      zh: '一碗飯', en: 'Bowl', colors: { a: B, b: O, c: G, d: W, w: W, k: K }, alt: [{ a: R, b: Y }, { a: W, b: O, w: B }],
      kw: ['吃', '飯', '餐', '料理', '煮', '咖哩', '麵', '美食', '火鍋', '拉麵', '便當', 'food', 'eat', 'cook', 'dinner', 'lunch', 'brunch', 'meal', 'curry', 'ramen'],
      art: ['..d..d..d...', '...d..d..d..', '..d..d..d...', '.bbbcbbcbbb.', 'kkkkkkkkkkkk', 'kaaaaaaaaaak',
        '.kaawaaaaak.', '..kaaaaaak..', '...kkkkkk...']
    },
    book: {
      zh: '書', en: 'Book', colors: { a: R, d: B, w: W, k: K }, alt: [{ a: B, d: R }, { a: G, d: K }],
      kw: ['書', '閱讀', '讀', '考試', '課', '研究', '筆記', '學習', '上學', 'book', 'read', 'study', 'learn', 'exam', 'class'],
      art: ['.kkkk..kkkk.', 'kwwwwkkwwwwk', 'kwddwkkwddwk', 'kwwwwkkwwwwk', 'kwddwkkwddwk', 'kwwwwkkwwwwk',
        'kwddwkkwddwk', 'kwwwwkkwwwwk', 'aaaaaaaaaaaa', '.aaaaaaaaaa.']
    },
    music: {
      zh: '音符', en: 'Music', colors: { a: P }, alt: [{ a: K }, { a: B }, { a: R }],
      kw: ['音樂', '歌', '唱', '演唱會', '吉他', '鋼琴', '樂團', 'music', 'song', 'sing', 'concert', 'guitar', 'piano'],
      art: ['....aaaaaaa.', '....aaaaaaa.', '....a.....a.', '....a.....a.', '....a.....a.', '....a.....a.',
        '....a.....a.', '..aaa...aaa.', '.aaaa..aaaa.', '.aaaa..aaaa.', '..aa....aa..']
    },
    chat: {
      zh: '對話', en: 'Chat', colors: { a: W, b: B, d: K, w: W }, alt: [{ b: G }, { b: P }],
      kw: ['聊', '朋友', '聚', '電話', '視訊', '見面', '同學', 'talk', 'chat', 'friend', 'call', 'meet'],
      art: ['.aaaaaa.....', 'aaaaaaaa....', 'aadadada....', 'aaaaaaaa....', '.aaaaaa.....', '.aa..bbbbbb.',
        '.a..bbbbbbbb', '....bwbwbwbb', '....bbbbbbbb', '.....bbbbbb.', '..........bb', '...........b']
    },
    house: {
      zh: '房子', en: 'House', colors: { a: R, b: B, c: BR, w: W }, alt: [{ a: B, b: Y }, { a: G, b: B }],
      kw: ['回家', '搬家', '家人', '老家', '房子', 'home', 'house', 'move', 'family'],
      art: ['.....aa..c..', '....aaaa.c..', '...aaaaaac..', '..aaaaaaaa..', '.aaaaaaaaaa.', 'aaaaaaaaaaaa',
        '.wwwwwwwwww.', '.wbbwwwccww.', '.wbbwwwccww.', '.wwwwwwccww.', '.wwwwwwccww.']
    },
    plane: {
      zh: '飛機', en: 'Plane', colors: { a: W, c: R }, alt: [{ a: W, c: B }, { a: Y, c: R }],
      kw: ['旅行', '飛機', '出國', '旅遊', '機場', '出差', 'trip', 'travel', 'flight', 'plane', 'vacation'],
      art: ['.....cc.....', '.....aa.....', '.....aa.....', '....aaaa....', '..aaaaaaaa..', 'aaaaaaaaaaaa',
        'aa...aa...aa', '.....aa.....', '.....aa.....', '....aaaa....', '...aa..aa...']
    },
    laptop: {
      zh: '電腦', en: 'Laptop', colors: { a: B, b: W, d: W, w: W, k: K }, alt: [{ a: G }, { a: P }],
      kw: ['工作', '報告', '會議', '上班', '專案', '電腦', '程式', '加班', '面試', '提案', 'work', 'report', 'meeting', 'project', 'code', 'job', 'interview', 'office'],
      art: ['.kkkkkkkkkk.', '.kaaaaaaaak.', '.kawaaaaaak.', '.kaddaaaaak.', '.kadddaaaak.', '.kaddaaaaak.',
        '.kkkkkkkkkk.', 'kbbbbbbbbbbk', 'kkkkkkkkkkkk']
    },
    cake: {
      zh: '蛋糕', en: 'Cake', colors: { a: PK, b: R, c: Y, d: B, w: W, k: K }, alt: [{ a: BR, b: W }, { a: Y, b: R }],
      kw: ['生日', '蛋糕', '慶祝', '派對', '甜點', '週年', 'birthday', 'cake', 'party', 'celebrate', 'dessert', 'anniversary'],
      art: ['...c..c..c..', '...d..d..d..', '...d..d..d..', '.wwwwwwwwww.', '.wawwawwawa.', '.aaaaaaaaaa.',
        '.bbbbbbbbbb.', '.aaaaaaaaaa.', '.aaaaaaaaaa.', 'kkkkkkkkkkkk']
    },
    cat: {
      zh: '貓', en: 'Cat', colors: { a: O, b: PK, c: PK, k: K }, alt: [{ a: K, k: Y, b: PK }, { a: W, b: PK }],
      kw: ['貓', 'cat', 'kitten'],
      art: ['.a........a.', '.ab......ba.', '.abb....bba.', '.aaaaaaaaaa.', 'aaaaaaaaaaaa', 'aaakaaaakaaa',
        'aaakaaaakaaa', 'kaaaaccaaaak', 'aaaaakkaaaaa', '.aaaaaaaaaa.', '..aaaaaaaa..']
    },
    paw: {
      zh: '腳印', en: 'Paw', colors: { a: BR }, alt: [{ a: K }, { a: O }],
      kw: ['狗', '寵物', '毛孩', 'dog', 'pet', 'puppy'],
      art: ['...aa..aa...', '..aaa..aaa..', '..aa....aa..', 'aa........aa', 'aaa..aa..aaa', 'aa.aaaaaa.aa',
        '...aaaaaa...', '..aaaaaaaa..', '..aaaaaaaa..', '...aaaaaa...']
    },
    shoe: {
      zh: '球鞋', en: 'Sneaker', colors: { a: R, b: W, w: W, k: K }, alt: [{ a: B }, { a: G }, { a: O }],
      kw: ['跑', '運動', '健身', '球', '騎', '瑜伽', '馬拉松', 'run', 'gym', 'sport', 'exercise', 'yoga', 'workout'],
      art: ['....kkk.....', '...kaaak....', '...kawaakk..', '..kaaawaaakk', 'kkaaaaaaaaak', 'kbbbbbbbbbbk', '.kkkkkkkkkk.']
    },
    rain: {
      zh: '雨雲', en: 'Rain', colors: { a: W, b: B }, alt: [{ a: P, b: B }],
      kw: ['雨', '陰天', '颱風', 'rain', 'cloudy', 'storm'],
      art: ['....aaa.....', '..aaaaaaa...', '.aaaaaaaaaa.', 'aaaaaaaaaaaa', 'aaaaaaaaaaaa', '.aaaaaaaaaa.',
        '............', '..b...b...b.', '.b...b...b..', '...b...b....', '..b...b.....']
    },
    star: {
      zh: '星星', en: 'Star', colors: { a: Y, c: O }, alt: [{ a: O, c: R }, { a: W, c: Y }],
      kw: ['星星', '夢', '成功', '完成', '達成', '獎', '突破', '錄取', 'win', 'goal', 'done', 'achieve', 'star', 'dream', 'finish', 'award'],
      art: ['.....aa.....', '.....aa.....', '....aaaa....', '....aaaa....', 'aaaaaaaaaaaa', '.aaaaaaaaaa.',
        '..aaaaaaaa..', '...aaaaacc..', '...aaaaacc..', '..aaa..acc..', '..aa....cc..', '.aa......cc.']
    },
    camera: {
      zh: '相機', en: 'Camera', colors: { a: W, b: B, w: W, k: K }, alt: [{ a: Y }, { a: PK, b: P }],
      kw: ['拍照', '照片', '攝影', '相機', 'photo', 'camera', 'picture'],
      art: ['..kkk.......', 'kkkkkkkkkkkk', 'kaaakkkkaaak', 'kaakbbbbkaak', 'kaakbwbbkaak', 'kaakbbbbkaak',
        'kaaakkkkaaak', 'kkkkkkkkkkkk']
    },
    movie: {
      zh: '電影', en: 'Movie', colors: { a: P, w: W, k: K }, alt: [{ a: R }, { a: B }],
      kw: ['電影', '看劇', '影集', '追劇', '動畫', 'movie', 'film', 'series', 'watch'],
      art: ['kkkkkkkkkkkk', 'kaaaaaaaaaak', 'kaaaawaaaaak', 'kaaaawwaaaak', 'kaaaawwwaaak', 'kaaaawwaaaak',
        'kaaaawaaaaak', 'kaaaaaaaaaak', 'kkkkkkkkkkkk', '...kk..kk...']
    },
    snow: {
      zh: '雪花', en: 'Snowflake', colors: { a: W }, alt: [{ a: B }],
      kw: ['雪', '冬', '冷', '聖誕', 'snow', 'winter', 'christmas', 'cold'],
      art: ['.....a.....', '...a.a.a...', '....aaa....', '.a...a...a.', '..a..a..a..', 'aaaaaaaaaaa',
        '..a..a..a..', '.a...a...a.', '....aaa....', '...a.a.a...', '.....a.....']
    },
    leaf: {
      zh: '楓葉', en: 'Leaf', colors: { a: O, b: BR }, alt: [{ a: R }, { a: Y }],
      kw: ['秋', '葉', '楓', 'autumn', 'fall', 'leaf'],
      art: ['.....a.....', '....aaa....', '.a..aaa..a.', '.aa.aaa.aa.', '..aaaaaaa..', 'aaaaaaaaaaa',
        '.aaaaaaaaa.', '..aaaaaaa..', '.aaa.b.aaa.', '.....b.....', '.....b.....']
    },
    game: {
      zh: '遊戲機', en: 'Game', colors: { a: P, b: R, c: Y, k: K }, alt: [{ a: B }, { a: W, b: R, c: B }],
      kw: ['遊戲', '打電動', '桌遊', 'game', 'gaming'],
      art: ['.kkkkkkkkkk.', 'kaaaaaaaaaak', 'kakaaaaaabak', 'kkkkaaaacaak', 'kakaaaaaabak', 'kaaakkkkaaak', '.kkk....kkk.']
    },
    pencil: {
      zh: '鉛筆', en: 'Pencil', colors: { a: Y, c: PK, w: O, k: K }, alt: [{ a: B }, { a: G }],
      kw: ['寫', '日記', '畫', '藝術', '創作', '設計', 'write', 'diary', 'draw', 'paint', 'art', 'design'],
      art: ['..........cc', '.........ccc', '........aac.', '.......aaa..', '......aaa...', '.....aaa....',
        '....aaa.....', '...aaa......', '..waa.......', '.ww.........', 'kw..........', 'k...........']
    },
    gift: {
      zh: '禮物', en: 'Gift', colors: { a: R, b: Y, k: K }, alt: [{ a: B, b: PK }, { a: G, b: R }],
      kw: ['禮物', '驚喜', 'gift', 'present', 'surprise'],
      art: ['..bb...bb..', '.b..b.b..b.', 'kkkkkbkkkkk', 'kaaaabaaaak', 'kkkkkbkkkkk', '.kaaabaaak.',
        '.kaaabaaak.', '.kaaabaaak.', '.kaaabaaak.', '.kkkkkkkkk.']
    },
    smile: {
      zh: '笑臉', en: 'Smile', colors: { a: Y, k: K }, alt: [{ a: O }, { a: PK }],
      kw: ['開心', '快樂', '笑', '好玩', '幸福', 'happy', 'fun', 'smile', 'laugh', 'joy'],
      art: ['...aaaaa...', '.aaaaaaaaa.', '.aaaaaaaaa.', 'aaakaaakaaa', 'aaakaaakaaa', 'aaaaaaaaaaa',
        'akaaaaaaaka', 'aakaaaaakaa', '.aakkkkkaa.', '.aaaaaaaaa.', '...aaaaa...']
    },
    sad: {
      zh: '累了', en: 'Tired', colors: { a: B, k: K }, alt: [{ a: P }, { a: W }],
      kw: ['累', '難過', '哭', '低落', '生病', '壓力', '感冒', 'tired', 'sad', 'cry', 'sick', 'stress'],
      art: ['...aaaaa...', '.aaaaaaaaa.', '.aaaaaaaaa.', 'aakkaaakkaa', 'aaaaaaaaaaa', 'aaaaaaaaaaa',
        'aaaaaaaaaaa', 'aaakkkkkaaa', '.akaaaaaka.', '.aaaaaaaaa.', '...aaaaa...']
    }
  };
  const MOTIF_KEYS = Object.keys(MOTIFS);

  // 情境：影響背景配色
  const SCENES = [
    { kw: ['夜', '晚', '睡', '星空', '熬夜', 'night', 'sleep'], bg: [[B, P], [P, B], [K, B]], spark: [Y, W] },
    { kw: ['早', '日出', '晨', 'sunrise', 'morning'], bg: [[Y, O], [PK, Y], [O, Y]], spark: [W, R] },
    { kw: ['雨', '颱風', 'rain', 'storm'], bg: [[B, P], [K, B]], spark: [W, B] },
    { kw: ['雪', '冬', '聖誕', 'snow', 'winter', 'christmas'], bg: [[B, W], [P, B]], spark: [W, W] },
    { kw: ['春', '花', 'spring', 'flower'], bg: [[PK, W], [Y, PK], [W, PK]], spark: [Y, G] },
    { kw: ['海', '湖', '游泳', 'sea', 'beach', 'swim'], bg: [[Y, W], [W, Y], [B, W]], spark: [W, Y] },
    { kw: ['山', '樹', '公園', '森林', 'hike', 'park', 'forest'], bg: [[B, W], [Y, W], [W, B]], spark: [W, Y] },
    { kw: ['秋', '楓', 'autumn', 'fall'], bg: [[Y, O], [BR, O], [W, Y]], spark: [O, R] }
  ];

  // 沒有關鍵字時的抽象配色
  const HARMONIES = [[B, Y, W, P], [G, Y, BR, W], [PK, P, W, B], [O, R, Y, BR], [B, G, Y, W], [K, Y, R, W], [P, PK, Y, B], [BR, O, W, G], [B, W, R, Y]];

  /* ---------- 工具 ---------- */
  function hash(s) { let h = 2166136261 >>> 0; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const blank = (c) => new Array(N).fill(c || 0);

  function findMotifs(text) {
    const s = String(text || '').toLowerCase();
    const hits = [];
    MOTIF_KEYS.forEach(k => {
      let best = null;
      MOTIFS[k].kw.forEach(w => {
        const en = /^[a-z]+$/.test(w);
        const i = en ? s.search(new RegExp('\\b' + w)) : s.indexOf(w);
        if (i < 0) return;
        // 越長的詞越具體，優先採用；一樣長就取先出現的
        const len = en ? Math.min(3, Math.ceil(w.length / 3)) : w.length;
        if (!best || len > best.len || (len === best.len && i < best.i)) best = { i, len };
      });
      if (best) hits.push([best, k]);
    });
    return hits.sort((a, b) => b[0].len - a[0].len || a[0].i - b[0].i).map(h => h[1]);
  }
  const sceneFor = text => { const s = String(text || '').toLowerCase(); return SCENES.find(sc => sc.kw.some(w => s.includes(w))) || null; };

  /* ---------- 背景 ---------- */
  function background(r, a, b) {
    const art = blank(a);
    const style = pick(r, ['solid', 'gradient', 'gradient', 'dots', 'stripes', 'burst', 'horizon']);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let useB = false;
      if (style === 'gradient') useB = (y / S) * 16 > BAYER[(y % 4) * 4 + (x % 4)] + 2;
      else if (style === 'dots') useB = x % 4 === 1 && y % 4 === 1;
      else if (style === 'stripes') useB = (x + y) % 6 < 2;
      else if (style === 'burst') { const ang = Math.atan2(y - 7.5, x - 7.5); useB = Math.floor((ang + Math.PI) / (Math.PI / 6)) % 2 === 0; }
      else if (style === 'horizon') useB = y >= 11;
      if (useB) art[y * S + x] = b;
    }
    return art;
  }

  /* ---------- 依關鍵字生成 ---------- */
  function fromMotif(key, text, n) {
    const r = rng(hash(text + '#' + n + '#' + key));
    const m = MOTIFS[key];
    const cmap = Object.assign({ k: K, w: W }, m.colors);
    if (n > 0 && m.alt && r() < 0.6) Object.assign(cmap, pick(r, m.alt));
    const used = new Set(Object.entries(cmap).filter(([role]) => role !== 'k').map(([, c]) => c));
    const scene = sceneFor(text);
    let bgA, bgB, spark;
    const okBg = c => !used.has(c) && c !== cmap.k;
    if (scene) {
      const opts = scene.bg.filter(([x]) => okBg(x));
      if (opts.length) { [bgA, bgB] = pick(r, opts); spark = pick(r, scene.spark); }
    }
    if (bgA == null) {
      const free = [W, Y, PK, B, G, O, P].filter(okBg);
      bgA = free.length ? pick(r, free) : W;
      const second = [W, Y, PK, B, G, O, P].filter(c => c !== bgA && okBg(c));
      bgB = second.length ? pick(r, second) : bgA;
    }
    if (bgB === cmap.k && cmap.k === K) bgB = bgA;
    const art = background(r, bgA, bgB);
    const h = m.art.length, w = m.art[0].length;
    const ox = Math.max(0, Math.min(S - w, Math.round((S - w) / 2 + (r() < 0.5 ? 0 : (r() < 0.5 ? -1 : 1)))));
    const oy = Math.max(0, Math.min(S - h, Math.round((S - h) / 2 + (r() < 0.5 ? 0 : (r() < 0.5 ? -1 : 1)))));
    const mask = new Array(N).fill(false);
    m.art.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') mask[(oy + y) * S + ox + x] = true; }));
    // 影子
    if (r() < 0.45) {
      const sh = [K, BR, P, B].find(c => c !== bgA && c !== bgB && !used.has(c));
      if (sh != null) for (let i = 0; i < N; i++) {
        if (!mask[i]) continue;
        const x = i % S + 1, y = Math.floor(i / S) + 1;
        if (x < S && y < S && !mask[y * S + x]) art[y * S + x] = sh;
      }
    }
    m.art.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') art[(oy + y) * S + ox + x] = cmap[ch] != null ? cmap[ch] : cmap.a; }));
    // 點綴
    const sparkPool = [Y, W, PK, O].filter(c => c !== bgA && c !== bgB);
    const sparkColor = spark != null ? spark : (sparkPool.length ? pick(r, sparkPool) : R);
    const count = 2 + Math.floor(r() * 4);
    for (let t = 0, placed = 0; t < 60 && placed < count; t++) {
      const x = 1 + Math.floor(r() * (S - 2)), y = 1 + Math.floor(r() * (S - 2));
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (mask[(y + dy) * S + x + dx]) { near = true; break; }
      if (near) continue;
      art[y * S + x] = sparkColor;
      if (r() < 0.35 && !mask[y * S + x - 1] && !mask[y * S + x + 1] && !mask[(y - 1) * S + x] && !mask[(y + 1) * S + x]) {
        art[y * S + x - 1] = art[y * S + x + 1] = art[(y - 1) * S + x] = art[(y + 1) * S + x] = sparkColor;
      }
      placed++;
    }
    // 外框
    if (r() < 0.2) {
      const fc = bgB !== bgA ? bgB : (bgA === W ? K : W);
      for (let i = 0; i < S; i++) { if (!mask[i]) art[i] = fc; if (!mask[(S - 1) * S + i]) art[(S - 1) * S + i] = fc; if (!mask[i * S]) art[i * S] = fc; if (!mask[i * S + S - 1]) art[i * S + S - 1] = fc; }
    }
    return art;
  }

  /* ---------- 抽象 ---------- */
  function abstract(text, n) {
    const r = rng(hash(text + '@' + n));
    const pal = pick(r, HARMONIES).slice().sort(() => r() - 0.5);
    const style = pick(r, ['quilt', 'quilt', 'landscape', 'rings']);
    let art = blank(pal[0]);
    if (style === 'quilt') {
      // 8×8 隨機雜訊，平滑兩次，再四向鏡射成萬花筒
      let q = [];
      for (let i = 0; i < 64; i++) q.push(Math.floor(r() * 3));
      for (let it = 0; it < 2; it++) {
        q = q.map((v, i) => {
          const x = i % 8, y = Math.floor(i / 8), cnt = [0, 0, 0];
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx >= 0 && yy >= 0 && xx < 8 && yy < 8) cnt[q[yy * 8 + xx]]++;
          }
          const m = Math.max(...cnt);
          return cnt[v] === m ? v : cnt.indexOf(m);
        });
      }
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const qx = x < 8 ? x : 15 - x, qy = y < 8 ? y : 15 - y;
        art[y * S + x] = pal[q[qy * 8 + qx]];
      }
      art[7 * S + 7] = art[7 * S + 8] = art[8 * S + 7] = art[8 * S + 8] = pal[3];
    } else if (style === 'landscape') {
      const sky = [pal[0], pal[1]], hill = [G, B, P, BR].filter(c => !sky.includes(c));
      const h1 = pick(r, hill), h2 = pick(r, hill.filter(c => c !== h1)) || h1;
      const sunC = [Y, O, W, PK].find(c => !sky.includes(c) && c !== h1 && c !== h2);
      const sx = 3 + Math.floor(r() * 10), sy = 3 + Math.floor(r() * 3);
      const p1 = r() * 6, p2 = r() * 6;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        let c = (y / S) * 16 > BAYER[(y % 4) * 4 + (x % 4)] + 4 ? sky[1] : sky[0];
        if ((x - sx) ** 2 + (y - sy) ** 2 <= 5) c = sunC;
        const back = 9 + Math.round(2 * Math.sin(x / 2.5 + p1));
        const front = 12 + Math.round(1.5 * Math.sin(x / 2 + p2));
        if (y >= back) c = h2;
        if (y >= front) c = h1;
        art[y * S + x] = c;
      }
    } else {
      const cx = 5 + r() * 6, cy = 5 + r() * 6;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) + (BAYER[(y % 4) * 4 + (x % 4)] / 16 - 0.5);
        art[y * S + x] = pal[Math.floor(d / 2.2) % pal.length];
      }
    }
    return art;
  }

  function generate(text, n) {
    n = n || 0;
    const t = String(text || '').trim();
    const found = findMotifs(t);
    if (found.length) {
      // 第一次用最先出現的關鍵字；之後輪流換成其他找到的圖案，偶爾換成抽象圖
      const key = found[n % found.length];
      return fromMotif(key, t, n);
    }
    return abstract(t || String(Math.random()), n);
  }

  function stamp(art, key) {
    const m = MOTIFS[key]; if (!m) return art;
    const out = art.slice();
    const cmap = Object.assign({ k: K, w: W }, m.colors);
    const h = m.art.length, w = m.art[0].length;
    const ox = Math.floor((S - w) / 2), oy = Math.floor((S - h) / 2);
    m.art.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') out[(oy + y) * S + ox + x] = cmap[ch] != null ? cmap[ch] : cmap.a; }));
    return out;
  }

  function motifPreview(key) {
    const m = MOTIFS[key];
    const used = new Set(Object.values(Object.assign({ w: W }, m.colors)));
    const bg = [W, Y, B, PK, G].find(c => !used.has(c));
    return stamp(blank(bg == null ? W : bg), key);
  }

  /* ---------- 背景圖樣（用兩種顏色） ---------- */
  const PATTERNS = {
    dots: (x, y) => x % 4 === 1 && y % 4 === 1,
    stripes: (x, y) => (x + y) % 6 < 3,
    waves: (x, y) => (y + [0, 1, 2, 2, 1, 0, 0, 1][x % 8]) % 5 === 0,
    checks: (x, y) => (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0,
    rings: (x, y) => Math.floor(Math.sqrt((x - 7.5) ** 2 + (y - 7.5) ** 2) / 2) % 2 === 0,
    gradient: (x, y) => (y / S) * 16 > BAYER[(y % 4) * 4 + (x % 4)] + 2
  };
  function pattern(key, a, b) {
    const f = PATTERNS[key]; const out = blank(b);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (f(x, y)) out[y * S + x] = a;
    return out;
  }

  /* ---------- 轉換與繪製 ---------- */
  const toStr = art => art.map(v => String(v)).join('');
  const fromStr = s => /^[0-9]{256}$/.test(s || '') ? [...s].map(Number) : null;
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  function nearest(hex) {
    const [r, g, b] = rgb(hex);
    let best = 0, bd = Infinity;
    PALETTE.forEach((p, i) => { const [pr, pg, pb] = rgb(p); const d = (pr - r) ** 2 + (pg - g) ** 2 + (pb - b) ** 2; if (d < bd) { bd = d; best = i; } });
    return best;
  }
  // 舊版 9×9 單色磁磚轉成 16×16
  function fromLegacy(bits81, onHex, offHex) {
    const on = nearest(onHex), off = nearest(offHex);
    const out = blank(off);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      if (bits81[Math.floor(y * 9 / S) * 9 + Math.floor(x * 9 / S)] === '1') out[y * S + x] = on;
    }
    return out;
  }
  // 圖裡最多的非白色，用來決定小格子的顏色
  function dominant(art) {
    const cnt = new Array(10).fill(0);
    art.forEach(v => cnt[v]++);
    let best = -1;
    cnt.forEach((c, i) => { if (i !== W && (best < 0 || c > cnt[best])) best = i; });
    return cnt[best] ? best : W;
  }
  function fill(art, idx, color) {
    const from = art[idx]; if (from === color) return art;
    const out = art.slice(), stack = [idx];
    while (stack.length) {
      const i = stack.pop();
      if (out[i] !== from) continue;
      out[i] = color;
      const x = i % S, y = Math.floor(i / S);
      if (x > 0) stack.push(i - 1); if (x < S - 1) stack.push(i + 1);
      if (y > 0) stack.push(i - S); if (y < S - 1) stack.push(i + S);
    }
    return out;
  }

  const cache = new Map();
  function url(art) {
    const key = typeof art === 'string' ? art : toStr(art);
    if (cache.has(key)) return cache.get(key);
    if (typeof art === 'string') art = fromStr(art) || blank(0);
    if (typeof document === 'undefined') return '';
    const cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(S, S);
    const cols = PALETTE.map(rgb);
    art.forEach((v, i) => { const c = cols[v] || cols[0]; img.data.set([c[0], c[1], c[2], 255], i * 4); });
    ctx.putImageData(img, 0, 0);
    const u = cv.toDataURL();
    if (cache.size > 2000) cache.clear();
    cache.set(key, u);
    return u;
  }

  root.LCTiles = {
    SIZE: S, PALETTE, NAMES, MOTIFS, MOTIF_KEYS, PATTERN_KEYS: Object.keys(PATTERNS),
    generate, stamp, motifPreview, pattern, fill, findMotifs, toStr, fromStr, fromLegacy, dominant, nearest, url, blank
  };
})(typeof window !== 'undefined' ? window : globalThis);
