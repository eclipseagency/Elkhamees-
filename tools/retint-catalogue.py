# -*- coding: utf-8 -*-
"""ينقل خلفية صور الكتالوج من العاجي #f2eee7 إلى سطح البلاطة الجديد.

الموقع صار أبيض (قرار 2026-07-29)، وصور القطع كانت موحّدة على العاجي
فظهرت كمربّع بيج تحت كل قطعة. إعادة تشغيل normalize-images.py تتطلب
الأصول؛ هذه الأداة تعمل على المخرجات نفسها: تزيح البكسلات القريبة من
اللون القديم بمقدار الفرق، وتخفّ الإزاحة كلما ابتعد البكسل عن الخلفية،
فالقطعة والظل لا يتلوّنان.

    python3 tools/retint-catalogue.py            # كل الصور
    python3 tools/retint-catalogue.py a.jpg b.jpg
"""
from PIL import Image
import numpy as np, sys, os, glob

OLD = np.array([242, 238, 231], dtype=np.float32)   # #f2eee7
NEW = np.array([247, 246, 244], dtype=np.float32)   # #f7f6f4  = --paper-3
FLAT    = 10.0        # فرق أقل من هذا = خلفية خالصة (ضغط JPEG وحده)، إزاحة كاملة
FALLOFF = 46.0        # وبعد هذا الفرق لا إزاحة إطلاقاً


def retint(path):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    # قرب البكسل من الخلفية القديمة → وزن الإزاحة
    dist = np.abs(a - OLD).max(axis=2)
    w = np.clip((FALLOFF - dist) / (FALLOFF - FLAT), 0.0, 1.0)[:, :, None]
    out = np.clip(a + (NEW - OLD) * w, 0, 255).astype(np.uint8)
    Image.fromarray(out).save(path, quality=92, subsampling=1)
    return path


if __name__ == '__main__':
    files = sys.argv[1:] or sorted(glob.glob(os.path.join('assets', 'catalogue', '*.jpg')))
    for f in files:
        print(retint(f))
