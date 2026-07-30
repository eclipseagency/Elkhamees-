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

    # المناسبات — التوزيع بالمزاج لا بالقطعة: الأحمر العميق للزواج،
    # الخواتم للخطوبة، الساتان والصينية للهدايا، الأخضر الفاتح للتخرج.
    ('Necklaces.jpeg', os.path.join(OUT, 'occ-wedding.jpg'),    1100, 1375),
    ('Rings.jpeg',     os.path.join(OUT, 'occ-engagement.jpg'), 1100, 1375),
    ('Bracelets.jpeg', os.path.join(OUT, 'occ-gifts.jpg'),      1100, 1375),
    ('Earning.png',    os.path.join(OUT, 'occ-graduation.jpg'), 1100, 1375),

    # القسم المنقسم في الرئيسية (صورة يمين وقائمة الفئات يسار)
    ('Necklaces.jpeg', os.path.join(OUT, 'split-necklaces.jpg'), 1200, 1600),

    # الهيرو — الخواتم: بيج فاتح وفراغ واسع، فالنص الحبري يُقرأ فوقه.
    ('Rings.jpeg',     os.path.join(OUT, 'hero-rings.jpg'),      2400, 1350),

    # شريط الدعوة — تحت حجاب داكن بشفافية .22، فالتفصيل ثانوي.
    ('Bracelets.jpeg', os.path.join(OUT, 'cta-bracelets.jpg'),   2000, 1125),
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
    for f, dst, w, h in MAP:
        p = os.path.join(src, f)
        if not os.path.exists(p):
            print('  ناقص: ' + p)
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        cut(Image.open(p), w, h).save(dst, quality=86, subsampling=1, optimize=True)
        print('%-38s ← %s' % (dst, f))
