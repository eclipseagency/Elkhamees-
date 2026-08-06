"""يركّب توقيع الموقع على واجهة المحل في لقطة الهوية.

    python3 tools/render-storefront.py

اللقطة الخام `concepts/rebrand-2026/mockups/raw/1-storefront.png` واجهتها
**فارغة** عمداً: المولّد لا يرسم الحروف العربية رسماً صحيحاً، فالتوقيع
يُركَّب متجهاً بتحويل منظوري. القاعدة نفسها في `mockups/composite.py`.

الفرق هنا أن التوقيع المركَّب هو `assets/brand/lockup-stack-ink.png` —
المبني من `data/catalogue.js` باسم الموقع — لا `logo/lockup-ink.png`
المكتوب «MUSAID ALKHAMEES»، فلا تحمل واجهة المحل اسماً غير اسم الموقع.
"""
import sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..',
                                'concepts', 'rebrand-2026', 'mockups'))
os.chdir(os.path.join(os.path.dirname(__file__), '..',
                      'concepts', 'rebrand-2026', 'mockups'))
from PIL import Image
from composite import place, on_plane

ROOT = os.path.join('..', '..', '..')
lock = Image.open(os.path.join(ROOT, 'assets', 'brand',
                               'lockup-stack-ink.png')).convert('RGBA')

base = Image.open('raw/1-storefront.png').convert('RGB')
panel = [(572, 120), (850, 58), (850, 352), (572, 374)]   # حواف اللوحة من الصورة
out = place(base, lock, on_plane(panel, .80, ratio=1413/2643), .85, 'multiply')

# 1376 عرضاً يكفي عرض القسم على الشاشات الكبيرة، وJPEG لأن اللقطة صورة لا رسم
out = out.resize((1600, round(out.height * 1600 / out.width)), Image.LANCZOS)
dst = os.path.join(ROOT, 'assets', 'editorial', 'storefront.jpg')
out.save(dst, quality=88, optimize=True)
print('كُتبت', os.path.normpath(dst), out.size)
