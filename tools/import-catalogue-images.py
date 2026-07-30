# -*- coding: utf-8 -*-
"""يجهّز صور الكتالوج الواردة من الدار لتناسب بلاطة المنتج في الموقع.

صور المورّد مربّعة 1:1، وبلاطة المنتج في الموقع بنسبة 4:5. القصّ إلى 4:5
يأكل أعلى القطعة وأسفلها (الأقراط الطويلة تُقطع)، فصور المنتج **تُحاط**
بالخلفية لا تُقصّ. وصور الموديل عمودية بطبيعتها والقطعة في وسطها الأعلى،
فتُقصّ من الجانبين بكامل ارتفاعها.

كذلك خلفية صور المورّد #fafafa رمادية باردة، وسطح البلاطة في الموقع
#f7f6f4 (--paper-3)، فيظهر المربّع أبرد من الصفحة. تُزاح الخلفية إلى لون
البلاطة بنفس منطق tools/retint-catalogue.py: الإزاحة كاملة على البكسل
القريب من الخلفية، وتخفّ كلما ابتعد، فالقطعة والظل لا يتلوّنان.

    python3 tools/import-catalogue-images.py <مجلد-الصور-الواردة>
"""
from PIL import Image
import numpy as np, sys, os

TILE = (1080, 1350)                                  # 4:5
PAPER3 = np.array([247, 246, 244], dtype=np.float32)  # #f7f6f4
SRC_BG = np.array([250, 250, 250], dtype=np.float32)  # #fafafa — خلفية المورّد
FLAT, FALLOFF = 10.0, 46.0

# ملف المورّد ← الاسم في الموقع، ونوع المعالجة.
# 'product' = إحاطة بالخلفية بعد إزاحة لونها. 'model' = قصّ من الجانبين.
MAP = [
    ('1.png',    'pear-quartet-ring.jpg',           'product'),
    ('11.jpeg',  'pear-quartet-ring-model.jpg',     'model'),
    ('2.png',    'pear-drop-necklace.jpg',          'product'),
    ('333.jpeg', 'pear-drop-necklace-model.jpg',    'model'),
    ('3.png',    'cascade-earrings.jpg',            'product'),
    ('22.jpeg',  'cascade-earrings-model.jpg',      'model'),
    ('4.png',    'marquise-collar-necklace.jpg',    'product'),
    # ⚠️ مؤقت: الإسورة لم تصل لها صورة منتج على خلفية بيضاء، فبطاقتها
    # تستخدم صورة الموديل. تُستبدل أول ما تصل صورة المنتج.
    ('44.jpeg',  'marquise-cuff-bracelet.jpg',      'model'),
]

OUT = os.path.join('assets', 'catalogue')


def retint(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    dist = np.abs(a - SRC_BG).max(axis=2)
    w = np.clip((FALLOFF - dist) / (FALLOFF - FLAT), 0.0, 1.0)[:, :, None]
    a = np.clip(a + (PAPER3 - SRC_BG) * w, 0, 255).astype(np.uint8)
    return Image.fromarray(a)


def as_product(im):
    """القطعة كاملة داخل بلاطة 4:5، والفراغ فوقها وتحتها بلون البلاطة."""
    im = retint(im)
    scale = min(TILE[0] / im.width, TILE[1] / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    tile = Image.new('RGB', TILE, tuple(int(c) for c in PAPER3))
    tile.paste(im, ((TILE[0] - im.width) // 2, (TILE[1] - im.height) // 2))
    return tile


def as_model(im):
    """قصّ من الجانبين بكامل الارتفاع — القطعة في وسط الإطار الأعلى."""
    im = im.convert('RGB')
    w = round(im.height * TILE[0] / TILE[1])
    if w > im.width:                      # صورة أعرض من اللازم: اقصص من الارتفاع
        h = round(im.width * TILE[1] / TILE[0])
        box = (0, (im.height - h) // 2, im.width, (im.height - h) // 2 + h)
    else:
        box = ((im.width - w) // 2, 0, (im.width - w) // 2 + w, im.height)
    return im.crop(box).resize(TILE, Image.LANCZOS)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    for f, name, kind in MAP:
        p = os.path.join(src, f)
        if not os.path.exists(p):
            print('  ناقص: ' + p)
            continue
        im = Image.open(p)
        out = (as_product if kind == 'product' else as_model)(im)
        dst = os.path.join(OUT, name)
        out.save(dst, quality=88, subsampling=1, optimize=True)
        print('%-34s ← %-10s %s' % (name, f, kind))
