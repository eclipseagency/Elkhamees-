# -*- coding: utf-8 -*-
"""ينقل خلفية صور الكتالوج المسطّحة إلى سطح البلاطة الحالي.

الأداة تعمل على المخرجات نفسها لا على الأصول: تزيح البكسلات القريبة من
اللون القديم بمقدار الفرق، وتخفّ الإزاحة كلما ابتعد البكسل عن الخلفية،
فالقطعة والظل لا يتلوّنان.

⚠️ لا تشغّلها على كل مجلد الكتالوج. صور الموديل وصور الفئات خلفياتها
تصوير حقيقي لا لون مسطّح، وصورتا الإسورتين مقصوصتان من صورة أجواء بخلفية
بيج. المسطّحة أربع فقط: الخاتم والقلادتان والأقراط — مرّرها بالاسم.

تاريخ النقلات: #f2eee7 → #f7f6f4 (2026-07-29، الموقع صار أبيض)، ثم
#f7f6f4 → #ffffff (2026-08-03، v7: الأبيض صار ناصعاً بقرار مصطفى، وأي
فرق ولو درجة يُظهر مربّعاً رمادياً دافئاً تحت كل قطعة).

    python3 tools/retint-catalogue.py            # كل الصور
    python3 tools/retint-catalogue.py a.jpg b.jpg
"""
from PIL import Image
import numpy as np, sys, os, glob

OLD = np.array([247, 246, 244], dtype=np.float32)   # #f7f6f4
NEW = np.array([255, 255, 255], dtype=np.float32)   # #ffffff  = --paper-3
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
    FLAT_BG = ['pear-quartet-ring.jpg', 'pear-drop-necklace.jpg',
               'marquise-collar-necklace.jpg', 'cascade-earrings.jpg']
    files = sys.argv[1:] or [os.path.join('assets', 'catalogue', f) for f in FLAT_BG]
    for f in files:
        print(retint(f))
