# -*- coding: utf-8 -*-
"""يجهّز صور الدار الأربع لكل مكان تحريري في الموقع.

الدار سلّمت أربع صور ستل-لايف حقيقية لقطعها (قلائد، خواتم، أساور، أقراط)
بتاريخ 2026-07-30، فحلّت محل صور المكتبة المستأجرة التي كانت في المناسبات
والهيرو وشريط الدعوة وقسم الفئات. قرار مصطفى: لا تبقى صورة مكتبة واحدة.

المصادر كلها مربّعة 1:1، والمواضع في الموقع بنسب مختلفة (4:5 للمناسبات،
3:4 للقسم المنقسم، 16:9 للهيرو وشريط الدعوة). لكل موضع قصّ من مركز
الصورة بنسبته، فلا تُمطّ صورة ولا تُترك هوامش.

    python3 tools/import-editorial-images.py <مجلد-الصور-الواردة>
"""
from PIL import Image
import sys, os

OUT = os.path.join('assets', 'editorial')
CAT = os.path.join('assets', 'catalogue')

# (المصدر، الوجهة، العرض، الارتفاع)
MAP = [
    # الفئات — تطابق حرفي بين الصورة والفئة
    ('Rings.jpeg',     os.path.join(CAT, 'cat-rings.jpg'),      900, 900),
    ('Necklaces.jpeg', os.path.join(CAT, 'cat-necklaces.jpg'),  900, 900),
    ('Bracelets.jpeg', os.path.join(CAT, 'cat-bracelets.jpg'),  900, 900),
    ('Earning.png',    os.path.join(CAT, 'cat-earrings.jpg'),   900, 900),

    # المناسبات — صور القطع **ملبوسة**، لا صور ستل-لايف. المناسبة إنسان
    # لابس القطعة؛ وضع صورة «قلائد» تحت «الزواج والملكة» يخلط الفئة
    # بالمناسبة ولا يقول شيئاً عن المناسبة (تصحيح مصطفى 2026-07-30).
    ('333.jpeg', os.path.join(OUT, 'occ-wedding.jpg'),    1100, 1375),   # فستان سهرة
    ('11.jpeg',  os.path.join(OUT, 'occ-engagement.jpg'), 1100, 1375),   # الخاتم في اليد
    ('44.jpeg',  os.path.join(OUT, 'occ-gifts.jpg'),      1100, 1375),   # إسورة على المعصم
    ('22.jpeg',  os.path.join(OUT, 'occ-graduation.jpg'), 1100, 1375),   # أقراط، مزاج نهاري

    # القسم المنقسم في الرئيسية (صورة يمين وقائمة الفئات يسار)
    ('Necklaces.jpeg', os.path.join(OUT, 'split-necklaces.jpg'), 1200, 1600),

    # الهيرو — الخواتم: بيج فاتح وفراغ واسع، فالنص الحبري يُقرأ فوقه.
    ('Rings.jpeg',     os.path.join(OUT, 'hero-rings.jpg'),      2400, 1350),

    # شريط الدعوة — تحت حجاب داكن بشفافية .22، فالتفصيل ثانوي.
    ('Bracelets.jpeg', os.path.join(OUT, 'cta-bracelets.jpg'),   2000, 1125),

    # سلايدات بانر الرئيسية الأربع (طلب العميل 2026-08-02): فئة لكل سلايد
    # بنفس ترتيب الفئات في الموقع. الأولى هي نفسها hero-rings.jpg حجماً
    # ونسبةً — تبقى ملفاً مستقلاً حتى يكون اسم السلايد مقروءاً في الكود.
    # 1920 لا 2400 وجودة 74 لا 86: أربع صور بدل واحدة، وكلها تجلس تحت حجاب
    # داكن — الوزن هنا يُدفع أربع مرات بينما الفرق البصري لا يُرى.
    ('Rings.jpeg',     os.path.join(OUT, 'hero-1-rings.jpg'),     1920, 1080, 74),
    ('Necklaces.jpeg', os.path.join(OUT, 'hero-2-necklaces.jpg'), 1920, 1080, 74),
    ('Bracelets.jpeg', os.path.join(OUT, 'hero-3-bracelets.jpg'), 1920, 1080, 74),
    ('Earning.png',    os.path.join(OUT, 'hero-4-earrings.jpg'),  1920, 1080, 74),
]


def cut(im, w, h):
    """قصّ من المركز بنسبة الوجهة ثم تصغير — بلا مطّ وبلا هوامش."""
    im = im.convert('RGB')
    target = w / h
    src = im.width / im.height
    if src > target:                       # المصدر أعرض: اقصص من الجانبين
        nw = round(im.height * target)
        box = ((im.width - nw) // 2, 0, (im.width - nw) // 2 + nw, im.height)
    else:                                  # المصدر أطول: اقصص من أعلى وأسفل
        nh = round(im.width / target)
        box = (0, (im.height - nh) // 2, im.width, (im.height - nh) // 2 + nh)
    return im.crop(box).resize((w, h), Image.LANCZOS)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    for row in MAP:
        f, dst, w, h = row[0], row[1], row[2], row[3]
        q = row[4] if len(row) > 4 else 86
        p = os.path.join(src, f)
        if not os.path.exists(p):
            print('  ناقص: ' + p)
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        cut(Image.open(p), w, h).save(dst, quality=q, subsampling=1, optimize=True)
        print('%-38s ← %s' % (dst, f))
