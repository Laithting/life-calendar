"""產生一生日歷的圖示、分享預覽圖與 App 素材（純 Python，不需要額外套件）。

用法：
  python tools/make_icons.py            # 網站圖示與分享預覽圖（docs/icons）
  python tools/make_icons.py --app      # 另外產生 App 素材（assets/，給 @capacitor/assets 使用）
"""
import os
import struct
import sys
import zlib

BG = (0x1A, 0x22, 0x42)
LIVED = (0xC9, 0xD2, 0xF0)
NOW = (0xF0, 0xB8, 0x4E)
RING = (0x4A, 0x55, 0x86)
PAPER = (0xEC, 0xEF, 0xF5)
NIGHT = (0x0E, 0x13, 0x25)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def write_png(path, w, h, px, alpha=False):
    ch = 4 if alpha else 3
    raw = b''.join(b'\x00' + bytes(px[y * w * ch:(y + 1) * w * ch]) for y in range(h))

    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)

    color_type = 6 if alpha else 2
    data = (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, color_type, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9))
            + chunk(b'IEND', b''))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(data)
    print('wrote', os.path.relpath(path, ROOT))


def grid_sampler(x0, y0, cols, rows, pitch, lived, now, fill=0.78):
    """回傳 sample(fx, fy) -> 顏色或 None（不在任何格子上）。"""
    cell = pitch * fill
    rad = cell * 0.22
    ring = max(1.0, cell * 0.12)
    off = (pitch - cell) / 2

    def sample(fx, fy):
        fx -= x0
        fy -= y0
        if fx < 0 or fy < 0:
            return None
        cx, cy = int(fx // pitch), int(fy // pitch)
        if cx >= cols or cy >= rows:
            return None
        lx = fx - cx * pitch - off
        ly = fy - cy * pitch - off
        if not (0 <= lx < cell and 0 <= ly < cell):
            return None
        dx = max(rad - lx, 0, lx - (cell - rad))
        dy = max(rad - ly, 0, ly - (cell - rad))
        d = (dx * dx + dy * dy) ** .5
        if d > rad:
            return None
        i = cy * cols + cx
        if i < lived:
            return LIVED
        if i == now:
            return NOW
        inner = min(lx, ly, cell - lx, cell - ly)
        if inner < ring or d > rad - ring:
            return RING
        return None
    return sample


def render(w, h, bg, sampler, ss=3, region=None, alpha=False):
    """region = (x0, y0, x1, y1)：只在這個範圍內取樣，其他地方直接填背景。"""
    ch = 4 if alpha else 3
    bgpx = bytes(bg) + (b'\x00' if alpha else b'')
    px = bytearray(bgpx * (w * h))
    rx0, ry0, rx1, ry1 = region or (0, 0, w, h)
    n = ss * ss
    for y in range(max(0, int(ry0)), min(h, int(ry1) + 1)):
        for x in range(max(0, int(rx0)), min(w, int(rx1) + 1)):
            r = g = b = a = 0
            for sy in range(ss):
                for sx in range(ss):
                    c = sampler(x + (sx + .5) / ss, y + (sy + .5) / ss)
                    if c is None:
                        if not alpha:
                            r += bg[0]; g += bg[1]; b += bg[2]
                    else:
                        r += c[0]; g += c[1]; b += c[2]; a += 255
            o = (y * w + x) * ch
            if alpha:
                if a:
                    k = a // 255
                    px[o:o + 4] = bytes((r // k, g // k, b // k, a // n))
            else:
                px[o:o + 3] = bytes((r // n, g // n, b // n))
    return px


def icon(size, area, bg=BG, alpha=False, ss=3):
    """5×5 的格子：前 13 格已度過，第 14 格是此刻。"""
    box = size * area
    x0 = (size - box) / 2
    s = grid_sampler(x0, x0, 5, 5, box / 5, 13, 13)
    return render(size, size, bg, s, ss=ss, region=(x0 - 2, x0 - 2, x0 + box + 2, x0 + box + 2), alpha=alpha)


def og_image():
    w, h = 1200, 630
    cols, rows, pitch = 52, 20, 19
    gw, gh = cols * pitch, rows * pitch
    x0, y0 = (w - gw) / 2, (h - gh) / 2
    lived = 52 * 11 + 23
    s = grid_sampler(x0, y0, cols, rows, pitch, lived, lived)
    return w, h, render(w, h, BG, s, ss=2, region=(x0 - 2, y0 - 2, x0 + gw + 2, y0 + gh + 2))


def main():
    icons = os.path.join(ROOT, 'docs', 'icons')
    for name, size, area in [('icon-192.png', 192, .72), ('icon-512.png', 512, .72),
                             ('maskable-512.png', 512, .56), ('apple-touch-icon.png', 180, .66)]:
        write_png(os.path.join(icons, name), size, size, icon(size, area))
    w, h, px = og_image()
    write_png(os.path.join(icons, 'og.png'), w, h, px)

    if '--app' in sys.argv:
        assets = os.path.join(ROOT, 'assets')
        write_png(os.path.join(assets, 'icon-only.png'), 1024, 1024, icon(1024, .66, ss=2))
        write_png(os.path.join(assets, 'icon-foreground.png'), 1024, 1024, icon(1024, .5, bg=(0, 0, 0), alpha=True, ss=2), alpha=True)
        write_png(os.path.join(assets, 'icon-background.png'), 1024, 1024, bytearray(bytes(BG) * (1024 * 1024)))
        for name, bg in [('splash.png', PAPER), ('splash-dark.png', NIGHT)]:
            size = 2732
            box = 420
            x0 = (size - box) / 2
            # 啟動畫面：背景色中間放一個圓角方塊圖示
            inner = icon(box, .66, ss=1)
            px = bytearray(bytes(bg) * (size * size))
            rad = box * 0.22
            for y in range(box):
                for x in range(box):
                    dx = max(rad - x, 0, x - (box - rad))
                    dy = max(rad - y, 0, y - (box - rad))
                    if dx * dx + dy * dy <= rad * rad:
                        o = ((int(x0) + y) * size + int(x0) + x) * 3
                        i = (y * box + x) * 3
                        px[o:o + 3] = inner[i:i + 3]
            write_png(os.path.join(assets, name), size, size, px)


if __name__ == '__main__':
    main()
