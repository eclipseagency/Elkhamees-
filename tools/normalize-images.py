# -*- coding: utf-8 -*-
"""يوحّد صور القطع على قماشة واحدة: خلفية #f2eee7، نسبة 4:5، هامش وظل ثابتان.
الأصول لا تُمسّ — المخرجات في assets/catalogue/. أعد التشغيل بعد أي صورة جديدة."""
from PIL import Image, ImageFilter, ImageChops
import numpy as np, sys, os

BG      = (242, 238, 231)   # #f2eee7
W, H    = 1200, 1500        # 4:5
MARGIN  = 0.14              # هامش من أصغر بُعد
SHADOW  = dict(blur=26, dy=20, alpha=44)

def subject_mask(rgb):
    """قناع الموضوع: البكسلات التي تبتعد عن لون الخلفية المقدّر من الإطار."""
    a = np.asarray(rgb).astype(np.int16)
    h, w, _ = a.shape
    edge = np.concatenate([a[:6].reshape(-1,3), a[-6:].reshape(-1,3),
                           a[:,:6].reshape(-1,3), a[:,-6:].reshape(-1,3)])
    bg = np.median(edge, axis=0)
    dist = np.abs(a - bg).sum(axis=2)
    # عتبة تتكيّف مع تباين الصورة بدل رقم ثابت
    thr = max(26, np.percentile(dist, 62))
    return (dist > thr).astype(np.uint8) * 255

def largest_blob(mask):
    """أكبر مكوّن متصل — يزيل النقط والضوضاء حول الحواف."""
    m = mask > 0
    h, w = m.shape
    lab = np.zeros((h, w), np.int32); cur = 0; best = (0, 0)
    idx = np.argwhere(m)
    if len(idx) == 0: return mask
    seen = np.zeros((h, w), bool)
    from collections import deque
    for y0, x0 in idx:
        if seen[y0, x0]: continue
        cur += 1; n = 0; q = deque([(y0, x0)]); seen[y0, x0] = True
        while q:
            y, x = q.popleft(); lab[y, x] = cur; n += 1
            for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                ny, nx = y+dy, x+dx
                if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        if n > best[1]: best = (cur, n)
    return ((lab == best[0]).astype(np.uint8) * 255)

def normalize(src, dst):
    im = Image.open(src)
    if im.mode == 'RGBA':                      # شفافية جاهزة = القناع موجود
        alpha = im.getchannel('A'); rgb = im.convert('RGB')
        if np.asarray(alpha).min() == 255:     # لا شفافية فعلية
            alpha = None
    else:
        alpha = None; rgb = im.convert('RGB')

    if alpha is None:
        small = rgb.resize((rgb.width//4, rgb.height//4))
        m = subject_mask(small)
        m = largest_blob(m)
        alpha = Image.fromarray(m).resize(rgb.size, Image.BILINEAR)
        alpha = alpha.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2.2))

    cut = Image.merge('RGBA', (*rgb.split(), alpha))
    bbox = alpha.point(lambda p: 255 if p > 24 else 0).getbbox()
    if bbox: cut = cut.crop(bbox)

    box_w, box_h = int(W*(1-2*MARGIN)), int(H*(1-2*MARGIN))
    s = min(box_w/cut.width, box_h/cut.height)
    cut = cut.resize((max(1,int(cut.width*s)), max(1,int(cut.height*s))), Image.LANCZOS)

    canvas = Image.new('RGB', (W, H), BG)
    x, y = (W-cut.width)//2, (H-cut.height)//2
    # ظل ناعم موحّد يعطي القطعة ثِقلاً على الخلفية المسطّحة
    sh = Image.new('L', (W, H), 0)
    sh.paste(cut.getchannel('A'), (x, y+SHADOW['dy']))
    sh = sh.filter(ImageFilter.GaussianBlur(SHADOW['blur'])).point(lambda p: p*SHADOW['alpha']//255)
    canvas.paste(Image.new('RGB', (W, H), (120, 108, 92)), (0, 0), sh)
    canvas.paste(cut, (x, y), cut)
    canvas.save(dst, quality=92, subsampling=1)
    return dst

if __name__ == '__main__':
    for src in sys.argv[1:]:
        out = os.path.join('assets/catalogue', os.path.splitext(os.path.basename(src))[0] + '.jpg')
        print(normalize(src, out))
