"""產生一生日歷的 App 圖示（純 Python，不需要額外套件）。"""
import struct, zlib, sys, os

BG = (0x1A, 0x22, 0x42)
LIVED = (0xC9, 0xD2, 0xF0)
NOW = (0xF0, 0xB8, 0x4E)
RING = (0x4A, 0x55, 0x86)

def png(path, w, h, px):
    raw = b''.join(b'\x00' + bytes(px[y*w*3:(y+1)*w*3]) for y in range(h))
    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)

def render(size, area):
    """area: 圖案佔整張圖的比例（maskable 圖示要留安全區）。"""
    N = 5                      # 5x5 格
    lived, now = 13, 13        # 前 13 格已度過，第 14 格是此刻
    box = size * area
    x0 = (size - box) / 2
    pitch = box / N
    cell = pitch * 0.78
    rad = cell * 0.22
    ring = max(1.0, cell * 0.12)
    ss = 3
    px = bytearray(size * size * 3)
    for y in range(size):
        for x in range(size):
            acc = [0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    fx = x + (sx + .5) / ss - x0
                    fy = y + (sy + .5) / ss - x0
                    col = BG
                    if 0 <= fx < box and 0 <= fy < box:
                        cx, cy = int(fx // pitch), int(fy // pitch)
                        lx = fx - cx * pitch - (pitch - cell) / 2
                        ly = fy - cy * pitch - (pitch - cell) / 2
                        if 0 <= lx < cell and 0 <= ly < cell:
                            dx = max(rad - lx, 0, lx - (cell - rad))
                            dy = max(rad - ly, 0, ly - (cell - rad))
                            d = (dx*dx + dy*dy) ** .5
                            if d <= rad:
                                i = cy * N + cx
                                if i < lived: col = LIVED
                                elif i == now: col = NOW
                                else:
                                    inner = min(lx, ly, cell - lx, cell - ly)
                                    if inner < ring or d > rad - ring: col = RING
                    acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2]
            n = ss * ss
            o = (y * size + x) * 3
            px[o], px[o+1], px[o+2] = acc[0]//n, acc[1]//n, acc[2]//n
    return px

out = sys.argv[1]
for name, size, area in [('icon-192.png', 192, .72), ('icon-512.png', 512, .72), ('maskable-512.png', 512, .56), ('apple-touch-icon.png', 180, .66)]:
    png(os.path.join(out, name), size, size, render(size, area))
    print('wrote', name)
