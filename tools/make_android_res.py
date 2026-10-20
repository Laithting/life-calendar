"""產生 Android 的 App 圖示與啟動畫面，取代 Capacitor 預設的圖。

用法：python tools/make_android_res.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_icons import BG, PAPER, ROOT, grid_sampler, icon, render, write_png  # noqa: E402

RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
DENSITIES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}


def masked(size, area, shape):
    """圖示加上圓角方形或圓形的透明外框（舊版 Android 的 ic_launcher / ic_launcher_round）。"""
    rgb = icon(size, area)
    out = bytearray(size * size * 4)
    rad = size * 0.22
    c = (size - 1) / 2
    for y in range(size):
        for x in range(size):
            cov = 0
            for sy in (.25, .75):
                for sx in (.25, .75):
                    fx, fy = x + sx, y + sy
                    if shape == 'round':
                        inside = (fx - size / 2) ** 2 + (fy - size / 2) ** 2 <= (size / 2) ** 2
                    else:
                        dx = max(rad - fx, 0, fx - (size - rad))
                        dy = max(rad - fy, 0, fy - (size - rad))
                        inside = dx * dx + dy * dy <= rad * rad
                    cov += inside
            i, o = (y * size + x) * 3, (y * size + x) * 4
            out[o:o + 3] = rgb[i:i + 3]
            out[o + 3] = cov * 255 // 4
    return out


def splash(w, h):
    box = int(min(w, h) * 0.28)
    x0, y0 = (w - box) / 2, (h - box) / 2
    s = grid_sampler(x0 + box * .17, y0 + box * .17, 5, 5, box * .66 / 5, 13, 13)
    rad = box * 0.22

    def sample(fx, fy):
        lx, ly = fx - x0, fy - y0
        if not (0 <= lx < box and 0 <= ly < box):
            return None
        dx = max(rad - lx, 0, lx - (box - rad))
        dy = max(rad - ly, 0, ly - (box - rad))
        if dx * dx + dy * dy > rad * rad:
            return None
        return s(fx, fy) or BG
    return render(w, h, PAPER, sample, ss=2, region=(x0 - 1, y0 - 1, x0 + box + 1, y0 + box + 1))


def main():
    for name, k in DENSITIES.items():
        d = os.path.join(RES, 'mipmap-' + name)
        legacy = round(48 * k)
        fg = round(108 * k)
        write_png(os.path.join(d, 'ic_launcher.png'), legacy, legacy, masked(legacy, .66, 'square'), alpha=True)
        write_png(os.path.join(d, 'ic_launcher_round.png'), legacy, legacy, masked(legacy, .6, 'round'), alpha=True)
        write_png(os.path.join(d, 'ic_launcher_foreground.png'), fg, fg, icon(fg, .46, bg=(0, 0, 0), alpha=True), alpha=True)
    sizes = {'mdpi': (320, 480), 'hdpi': (480, 800), 'xhdpi': (720, 1280), 'xxhdpi': (960, 1600), 'xxxhdpi': (1280, 1920)}
    for name, (w, h) in sizes.items():
        write_png(os.path.join(RES, 'drawable-port-' + name, 'splash.png'), w, h, splash(w, h))
        write_png(os.path.join(RES, 'drawable-land-' + name, 'splash.png'), h, w, splash(h, w))
    write_png(os.path.join(RES, 'drawable', 'splash.png'), 480, 320, splash(480, 320))


if __name__ == '__main__':
    main()
