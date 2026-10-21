"""把 Unicode CLDR 的 emoji 關鍵字整理成 docs/emoji-data.js，給「依文字生成」找圖用。

資料來源（Unicode License v3）：
  https://unpkg.com/cldr-annotations-full@48.2.0/annotations/zh-Hant/annotations.json
  https://unpkg.com/cldr-annotations-full@48.2.0/annotations/en/annotations.json
  https://unpkg.com/cldr-annotations-derived-full@48.2.0/annotationsDerived/zh-Hant/annotations.json
  https://unpkg.com/cldr-annotations-derived-full@48.2.0/annotationsDerived/en/annotations.json

用法：python tools/build_emoji.py <放上面四個 JSON 的資料夾>
檔名要是 ann-zh-Hant.json、ann-en.json、der-zh-Hant.json、der-en.json。
"""
import json
import os
import sys
from collections import defaultdict

src = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'emoji-data.js')

# 太籠統、會對到很多不相干圖的詞
STOP = {
    'zh': set('臉 人 手 男 女 男人 女人 男性 女性 人物 符號 標誌 表情 臉部 物件 東西 動物 食物 飲料 樂器 交通工具 地點 鐵 '
              '無法決定 猶豫不決 星巴克 其他 圖示 物品 身體 部位 顏色 形狀 方向 箭頭 時間 天氣 自然 植物 活動 '
              '一 二 三 四 五 六 七 八 九 十 大 小 上 下 左 右 中 是 不 好 有 的 一次 新手 第一 開始 結束 完成 完了 收到 好的 可以 沒有 今天 明天 昨天'.split()),
    'en': set('face person man woman symbol sign object animal food drink thing other icon body part color shape '
              'direction arrow time weather nature plant activity the and with'.split()),
}


def is_emoji(s):
    cps = [ord(c) for c in s]
    if any(0x1F1E6 <= c <= 0x1F1FF for c in cps):      # 國旗（Windows 會顯示成字母）
        return False
    if any(0x1F3FB <= c <= 0x1F3FF for c in cps):      # 膚色
        return False
    if any(0x1F9B0 <= c <= 0x1F9B3 for c in cps) and len(cps) == 1:  # 髮型零件
        return False
    main = [c for c in cps if c not in (0x200D, 0xFE0F, 0x20E3)]
    return any(c >= 0x1F000 or 0x2600 <= c <= 0x27BF or 0x2300 <= c <= 0x23FF or 0x2B00 <= c <= 0x2BFF for c in main)


def load(path):
    if not os.path.exists(path):
        return {}
    d = json.load(open(path, encoding='utf-8'))
    key = 'annotations' if 'annotations' in d else 'annotationsDerived'
    return d[key]['annotations']


def build(lang):
    entries = {}
    for name in (f'ann-{lang}.json', f'der-{lang}.json'):
        for e, v in load(os.path.join(src, name)).items():
            if not is_emoji(e):
                continue
            tts = (v.get('tts') or [''])[0]
            kws = [tts] + [k for k in v.get('default', []) if k != tts]
            entries.setdefault(e, kws)
    # 一個詞對到太多 emoji 就不用
    count = defaultdict(int)
    for e, kws in entries.items():
        for k in set(kws):
            count[k.lower()] += 1
    rows = []
    for e, kws in entries.items():
        tts = kws[0].strip().lower()
        keep = []
        for k in kws:
            k = k.strip().lower()
            if not k or k in STOP[lang[:2]] or count[k] > 6:
                continue
            if lang == 'en' and len(k) < 3:
                continue
            # 單一個字太容易誤判（「看」「吃」），只有當它就是正式名稱時才用
            if lang != 'en' and len(k) == 1 and k != tts:
                continue
            if k not in keep:
                keep.append(k)
        if keep:
            rows.append([e, tts] + keep)
    return rows


data = {'zh': build('zh-Hant'), 'en': build('en')}
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('/* emoji 關鍵字對照表，由 tools/build_emoji.py 從 Unicode CLDR 48.2 產生，請勿手動修改。 */\n')
    f.write('window.LCEmojiData=')
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    f.write(';\n')
print('zh', len(data['zh']), 'en', len(data['en']), 'bytes', os.path.getsize(OUT))
