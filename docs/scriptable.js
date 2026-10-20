// 一生日歷 · iPhone 桌面小工具（Scriptable）
// 支援主畫面的小、中、大尺寸，以及鎖定畫面的圓形、長方形、單行小工具。
// 也可以在小工具設定的「Parameter」欄填「生日,壽命」覆蓋下面的設定，例如：1996-05-20,80
// Life Calendar widget for Scriptable. Widget parameter "YYYY-MM-DD,years" overrides the values below.

const BIRTH = "1996-05-20"; // @birth
const LIFE = 80; // @life
const LANG = "zh"; // @lang
const SITE = "https://laithting.github.io/life-calendar/";

const C = {
  bg: new Color("#10162B"),
  ink: new Color("#E6EAF5"),
  muted: new Color("#8E97B3"),
  lived: new Color("#8796D8"),
  line: new Color("#2B3456"),
  now: new Color("#F0B84E")
};

const TXT = {
  zh: {
    name: "一生日歷",
    week: n => `第 ${n} 週`,
    left: n => `還有 ${n} 週`,
    life: p => `一生 ${p}`,
    year: (y, p) => `${y} 年 ${p}`,
    inline: (n, p) => `第 ${n} 週 · 一生 ${p}`,
    reflect: ["今天不會再來第二次。","你正在過的這一週，是唯一發光的那一格。","不必把每一格填滿，只要記得自己在哪裡。","和重要的人吃一頓飯，比延後的計畫更值得。","慢慢來，但不要等。","前方的格子很多，但每一格都只能用一次。","留一點時間給沒有目的的散步。","今天做一件讓下週的自己感謝的小事。","把「改天」換成一個日期。","走過的格子都算數。","打一通電話給很久沒聯絡的人。","少滑一次手機，多看一次天色。","今天的你，是往後最年輕的你。","先做在乎的事，再處理緊急的事。"]
  },
  en: {
    name: "Life Calendar",
    week: n => `Week ${n}`,
    left: n => `${n} weeks left`,
    life: p => `Life ${p}`,
    year: (y, p) => `${y} ${p}`,
    inline: (n, p) => `Week ${n} · ${p} of life`,
    reflect: ["Today won't come twice.","This week is the only square that glows.","You don't have to fill every square.","A meal with someone you love beats a postponed plan.","Go slowly, but don't wait.","Each square ahead can be used only once.","Leave time for a walk with no purpose.","Do one small thing next week's you will thank you for.","Replace \"someday\" with a date.","Every square you have lived counts.","Call someone you haven't talked to in a while.","Scroll less. Look at the sky more.","Today you are the youngest you will ever be again.","Do what you care about before what feels urgent."]
  }
};

// ---------- 計算 ----------
let birthStr = BIRTH, life = LIFE;
const param = (args.widgetParameter || "").trim();
if (param) {
  const [b, l] = param.split(/[,，\s]+/);
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(b || "")) birthStr = b;
  if (l && Number(l) >= 40 && Number(l) <= 120) life = Math.round(Number(l));
}
const T = TXT[LANG] || TXT.zh;
const [by, bm, bd] = birthStr.split("-").map(Number);
const DAY = 864e5;
const dn = d => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
function addYears(n) {
  const d = new Date(by + n, bm - 1, 1);
  d.setDate(Math.min(bd, new Date(by + n, bm, 0).getDate()));
  return d;
}
const birth = new Date(by, bm - 1, bd);
const death = addYears(life);
const now = new Date();
const livedDays = dn(now) - dn(birth);
const weekNo = Math.floor(livedDays / 7) + 1;
const totalWeeks = (dn(death) - dn(birth)) / 7;
const weeksLeft = Math.max(0, Math.round(totalWeeks - weekNo + 1));
const lifeP = Math.max(0, Math.min(1, (now - birth) / (death - birth)));
let age = now.getFullYear() - by;
if (dn(addYears(age)) > dn(now)) age--;
age = Math.max(0, age);
const weekInYear = Math.min(51, Math.floor((dn(now) - dn(addYears(age))) / 7));
const y0 = new Date(now.getFullYear(), 0, 1), y1 = new Date(now.getFullYear() + 1, 0, 1);
const yearP = (now - y0) / (y1 - y0);
const doy = dn(now) - dn(y0);
const reflection = T.reflect[(doy + now.getFullYear()) % T.reflect.length];
const fmt = n => Math.round(n).toLocaleString(LANG === "en" ? "en-US" : "zh-TW");
const pct = (p, d) => (p * 100).toFixed(d) + "%";

// ---------- 繪圖 ----------
function ctx(w, h) {
  const dc = new DrawContext();
  dc.size = new Size(w, h);
  dc.opaque = false;
  dc.respectScreenScale = true;
  return dc;
}
function roundRect(dc, x, y, w, h, r, color) {
  const p = new Path();
  p.addRoundedRect(new Rect(x, y, w, h), r, r);
  dc.addPath(p);
  dc.setFillColor(color);
  dc.fillPath();
}
function barImage(p, w, h, color) {
  const dc = ctx(w, h);
  roundRect(dc, 0, 0, w, h, h / 2, C.line);
  if (p > 0) roundRect(dc, 0, 0, Math.max(h, w * p), h, h / 2, color);
  return dc.getImage();
}
// 一格一年：lived 已度過，current 此刻
function yearsImage(w, h) {
  const cols = 10, rows = Math.ceil(Math.max(life, age + 1) / cols);
  const gap = 2;
  const cell = Math.min((w - gap * (cols - 1)) / cols, (h - gap * (rows - 1)) / rows);
  const dc = ctx(cols * cell + gap * (cols - 1), rows * cell + gap * (rows - 1));
  for (let i = 0; i < rows * cols && i < Math.max(life, age + 1); i++) {
    const x = (i % cols) * (cell + gap), y = Math.floor(i / cols) * (cell + gap);
    if (i < age) roundRect(dc, x, y, cell, cell, cell * .2, C.lived);
    else if (i === age) roundRect(dc, x, y, cell, cell, cell * .2, C.now);
    else {
      roundRect(dc, x, y, cell, cell, cell * .2, C.line);
      roundRect(dc, x + 1, y + 1, cell - 2, cell - 2, cell * .18, C.bg);
    }
  }
  return dc.getImage();
}
// 一格一週：每一列是一年
function weeksImage(w, h) {
  const rows = Math.max(life, age + 1), cols = 52;
  const gx = 1, gy = 1;
  const cw = (w - gx * (cols - 1)) / cols;
  const ch = (h - gy * (rows - 1)) / rows;
  const dc = ctx(w, h);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * (cw + gx), y = r * (ch + gy);
      const lived = r < age || (r === age && c < weekInYear);
      const cur = r === age && c === weekInYear;
      dc.setFillColor(cur ? C.now : lived ? C.lived : C.line);
      dc.fillRect(new Rect(x, y, cw, ch));
    }
  }
  return dc.getImage();
}
function ringImage(p, size) {
  const dc = ctx(size, size);
  const lw = size * 0.11, r = size / 2 - lw / 2, c = size / 2;
  const arc = (from, to, color) => {
    const pts = [];
    const steps = Math.max(2, Math.ceil((to - from) * 60));
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 2 + (from + (to - from) * i / steps) * Math.PI * 2;
      pts.push(new Point(c + r * Math.cos(a), c + r * Math.sin(a)));
    }
    const path = new Path();
    path.addLines(pts);
    dc.addPath(path);
    dc.setStrokeColor(color);
    dc.setLineWidth(lw);
    dc.strokePath();
  };
  arc(0, 1, new Color("#FFFFFF", 0.25));
  if (p > 0) arc(0, p, Color.white());
  dc.setFont(Font.boldRoundedSystemFont(size * 0.26));
  dc.setTextColor(Color.white());
  dc.setTextAlignedCenter();
  dc.drawTextInRect(Math.round(p * 100) + "%", new Rect(0, size * 0.34, size, size * 0.34));
  return dc.getImage();
}

function text(stack, str, font, color, opts) {
  const t = stack.addText(str);
  t.font = font;
  t.textColor = color;
  if (opts && opts.lines) t.lineLimit = opts.lines;
  t.minimumScaleFactor = 0.6;
  return t;
}

// ---------- 版面 ----------
function smallBlock(stack, wide) {
  text(stack, T.name, Font.mediumSystemFont(11), C.muted);
  stack.addSpacer(4);
  text(stack, T.week(fmt(weekNo)), Font.boldRoundedSystemFont(wide ? 26 : 24), C.ink, {lines: 1});
  stack.addSpacer(6);
  const img = stack.addImage(barImage(lifeP, 120, 6, C.lived));
  img.imageSize = new Size(120, 6);
  stack.addSpacer(4);
  text(stack, T.life(pct(lifeP, 1)), Font.mediumMonospacedSystemFont(11), C.ink);
  text(stack, T.left(fmt(weeksLeft)), Font.regularSystemFont(11), C.muted);
  stack.addSpacer(6);
  const yb = stack.addImage(barImage(yearP, 120, 4, C.now));
  yb.imageSize = new Size(120, 4);
  stack.addSpacer(3);
  text(stack, T.year(now.getFullYear(), pct(yearP, 0)), Font.regularSystemFont(10), C.muted);
}

function buildWidget(family) {
  const w = new ListWidget();
  w.url = SITE;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1);
  w.refreshAfterDate = tomorrow;

  if (family === "accessoryInline") {
    w.addText(T.inline(fmt(weekNo), pct(lifeP, 1)));
    return w;
  }
  if (family === "accessoryCircular") {
    w.addAccessoryWidgetBackground = true;
    const img = w.addImage(ringImage(lifeP, 120));
    img.centerAlignImage();
    return w;
  }
  if (family === "accessoryRectangular") {
    w.addAccessoryWidgetBackground = true;
    const t1 = w.addText(T.week(fmt(weekNo)));
    t1.font = Font.boldRoundedSystemFont(15);
    w.addSpacer(3);
    const img = w.addImage(barImage(lifeP, 140, 5, Color.white()));
    img.imageSize = new Size(140, 5);
    w.addSpacer(3);
    const t2 = w.addText(`${T.life(pct(lifeP, 1))} · ${T.left(fmt(weeksLeft))}`);
    t2.font = Font.regularSystemFont(11);
    t2.minimumScaleFactor = 0.7;
    return w;
  }

  w.backgroundColor = C.bg;

  if (family === "small") {
    w.setPadding(14, 14, 12, 14);
    smallBlock(w, false);
    return w;
  }

  if (family === "medium") {
    w.setPadding(14, 16, 14, 16);
    const row = w.addStack();
    row.layoutHorizontally();
    const left = row.addStack();
    left.layoutVertically();
    smallBlock(left, true);
    row.addSpacer();
    const right = row.addStack();
    right.layoutVertically();
    right.centerAlignContent();
    const img = right.addImage(yearsImage(150, 128));
    img.imageSize = new Size(150, 128);
    return w;
  }

  // large 與 extraLarge
  w.setPadding(16, 16, 14, 16);
  const head = w.addStack();
  head.layoutHorizontally();
  head.bottomAlignContent();
  text(head, T.week(fmt(weekNo)), Font.boldRoundedSystemFont(22), C.ink, {lines: 1});
  head.addSpacer();
  text(head, `${pct(lifeP, 1)} · ${T.left(fmt(weeksLeft))}`, Font.mediumMonospacedSystemFont(11), C.muted, {lines: 1});
  w.addSpacer(8);
  const big = family === "extraLarge";
  const img = w.addImage(weeksImage(big ? 640 : 300, 250));
  img.imageSize = new Size(big ? 640 : 300, 250);
  img.centerAlignImage();
  w.addSpacer(8);
  text(w, reflection, Font.regularSystemFont(12), C.muted, {lines: 2});
  return w;
}

const family = config.widgetFamily || "medium";
const widget = buildWidget(family);
if (config.runsInWidget) {
  Script.setWidget(widget);
} else if (family === "small") {
  await widget.presentSmall();
} else if (family === "large") {
  await widget.presentLarge();
} else {
  await widget.presentMedium();
}
Script.complete();
