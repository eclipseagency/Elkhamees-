# -*- coding: utf-8 -*-
"""يجهّز صور الكتالوج الواردة من الدار لتناسب بلاطة المنتج في الموقع.

صور المورّد كلها مربّعة 1:1 — المنتج والموديل. فالبلاطة صارت 1:1 كذلك
(قرار 2026-07-30): لا قصّ ولا إحاطة، الصورة تصل كما صوّرتها الدار. القياس
السابق 4:5 كان يضيف هوامش تحت المنتج ويقصّ جوانب صور الموديل بلا داعٍ.

كذلك خلفية صور المورّد #fafafa رمادية باردة، وسطح البلاطة في الموقع
#f7f6f4 (--paper-3)، فيظهر المربّع أبرد من الصفحة. تُزاح الخلفية إلى لون
البلاطة بنفس منطق tools/retint-catalogue.py: الإزاحة كاملة على البكسل
القريب من الخلفية، وتخفّ كلما ابتعد، فالقطعة والظل لا يتلوّنان.

    python3 tools/import-catalogue-images.py <مجلد-الصور-الواردة>
"""
from PIL import Image
import numpy as np, sys, os

TILE = (1200, 1200)                                  # 1:1 — نسبة صور المورّد نفسها
PAPER3 = np.array([247, 246, 244], dtype=np.float32)  # #f7f6f4
SRC_BG = np.array([250, 250, 250], dtype=np.float32)  # #fafafa — خلفية المورّد
FLAT, FALLOFF = 10.0, 46.0

# ملف المورّد ← الاسم في الموقع، ونوع المعالجة.
# 'product' = إحاطة بالخلفية بعد إزاحة لونها. 'model' = قصّ من الجانبين.
MAP = [
    ('1.png',    'pear-quartet-ring.jpg',           'product'),
    ('11.jpeg',  'pear-quartet-ring-model.jpg',     'model'),
    ('2.png',    'pear-drop-necklace.jpg',          'product'),
    # 33.jpeg و333.jpeg نفس القلادة على نفس الموديل بكادرين. المختار هو
    # الأقرب لأن القلادة تُقرأ أوضح داخل بلاطة صغيرة (اختيار مصطفى 2026-07-30).
    ('33.jpeg',  'pear-drop-necklace-model.jpg',    'model'),
    ('3.png',    'cascade-earrings.jpg',            'product'),
    ('22.jpeg',  'cascade-earrings-model.jpg',      'model'),
    ('4.png',    'marquise-collar-necklace.jpg',    'product'),
    # صورة موديل القلادة العريضة صارت 44.jpeg — القطعة على المعصم، تصوير
    # حقيقي (اختيار مصطفى 2026-08-03). حلّت محل صورة مولّدة بالذكاء
    # الاصطناعي (4model-ai.png) وُضعت على الرقبة وحُذفت. 44.jpeg نفسها تُغذّي
    # بلاطة مناسبة «الهدايا» في import-editorial-images.py، فهي في موضعين.
    # الملف المنشور قُصّ من `assets/editorial/occ-gifts.jpg` لأن 44.jpeg ليست
    # في المستودع (تأتي من مجلد المورّد)، وقصّه يضع المعصم في وسط المربّع.
    ('44.jpeg', 'marquise-collar-necklace-model.jpg', 'model'),
    # 44.jpeg إسورة من نفس الطقم، وليست صورة ثانية للقلادة العريضة. لا تدخل
    # الكتالوج حتى تصل صورة منتجها، ولا تُستخدم هوفراً لقطعة أخرى.
]

OUT = os.path.join('assets', 'catalogue')


def retint(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    dist = np.abs(a - SRC_BG).max(axis=2)
    w = np.clip((FALLOFF - dist) / (FALLOFF - FLAT), 0.0, 1.0)[:, :, None]
    a = np.clip(a + (PAPER3 - SRC_BG) * w, 0, 255).astype(np.uint8)
    return Image.fromarray(a)


FILL = 0.86   # نسبة ما تشغله القطعة من البلاطة بعد التقريب


def bbox(im):
    """حدود القطعة داخل الإطار: أول بكسل يبتعد عن الخلفية في كل اتجاه."""
    import numpy as np
    a = np.asarray(im.convert('RGB')).astype(np.int16)
    mask = np.abs(a - SRC_BG).max(axis=2) > 12
    ys, xs = np.where(mask)
    if not len(xs):
        return (0, 0, im.width, im.height)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


def as_product(im):
    """القطعة تُقصّ على حدودها ثم تُقرَّب حتى تشغل 86% من البلاطة.

    صور المورّد فيها هامش واسع حول القطعة، فكانت القطعة تطلع صغيرة داخل
    بلاطة كبيرة و«لا تُعرض جيداً» (ملاحظة مصطفى 2026-07-30). التقريب موحّد
    بنسبة واحدة لكل القطع، فتبقى النسب بينها محفوظة ولا تكبر قطعة على أخرى.
    """
    im = retint(im)
    x0, y0, x1, y1 = bbox(im)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    side = max(x1 - x0, y1 - y0) / FILL              # مربّع حول القطعة
    side = min(side, im.width, im.height)            # لا يخرج عن الأصل
    l = max(0, min(im.width - side, cx - side / 2))
    t = max(0, min(im.height - side, cy - side / 2))
    im = im.crop((round(l), round(t), round(l + side), round(t + side)))
    return im.resize(TILE, Image.LANCZOS)


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
        # اسم فيه مسار = ملف من المستودع نفسه (أصل غير مصوّر)، لا من مجلد المورّد.
        p = f if os.sep in f or '/' in f else os.path.join(src, f)
        if not os.path.exists(p):
            print('  ناقص: ' + p)
            continue
        im = Image.open(p)
        out = (as_product if kind == 'product' else as_model)(im)
        dst = os.path.join(OUT, name)
        out.save(dst, quality=88, subsampling=1, optimize=True)
        print('%-34s ← %-10s %s' % (name, f, kind))
