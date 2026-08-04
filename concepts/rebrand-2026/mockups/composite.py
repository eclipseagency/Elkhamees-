"""يركّب علامة الخاء الحقيقية على أسطح فارغة في اللقطات المولّدة.

المولّد لا يرسم الحروف العربية رسماً صحيحاً، فالأسطح تُطلب فارغة ثم تُركَّب
عليها العلامة المتجهة نفسها بتحويل منظوري. هذه هي القاعدة نفسها المسجّلة في
خط أنابيب إعلانات NICK: الشعار يُركَّب ولا يُولَّد.
"""
from PIL import Image
import numpy as np, sys

def coeffs(dst, src):
    """معاملات التحويل المنظوري التي تتوقعها PIL (من الوجهة إلى المصدر)."""
    A, B = [], []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u*x, -u*y]); B.append(u)
        A.append([0, 0, 0, x, y, 1, -v*x, -v*y]); B.append(v)
    return np.linalg.solve(np.array(A, float), np.array(B, float))


def on_plane(corners, frac=0.5, shift=(0.0, 0.0)):
    """رباعي متمركز داخل مستوى السطح نفسه، فيرث منظوره بدل تخمينه.

    corners = [يسار، خلف، يمين، أمام] لحواف السطح. frac نسبة العرض،
    shift إزاحة بوحدات نصف السطح.
    """
    import numpy as _np
    L, T, R, B = [_np.array(c, float) for c in corners]
    centre = (L + R) / 2
    u, v = T - L, B - L          # اتجاها المستوى
    # سطح غير مربّع يمطّ العلامة، فيُساوى طول المحورين قبل القياس
    nu, nv = _np.linalg.norm(u), _np.linalg.norm(v)
    if nu and nv:
        side = min(nu, nv)
        u, v = u / nu * side, v / nv * side
    centre = centre + shift[0]*u + shift[1]*v
    s = frac / 2
    return [tuple(centre - s*u - s*v), tuple(centre + s*u - s*v),
            tuple(centre + s*u + s*v), tuple(centre - s*u + s*v)]

def place(base, logo, quad, opacity=1.0, blend="normal"):
    """يضع الشعار داخل رباعي الأضلاع quad = [TL, TR, BR, BL] بإحداثيات الصورة."""
    W, H = base.size
    warped = logo.transform((W, H), Image.PERSPECTIVE,
                            coeffs(quad, [(0,0), (logo.width,0), (logo.width,logo.height), (0,logo.height)]),
                            Image.BICUBIC)
    a = warped.getchannel("A").point(lambda v: int(v*opacity))
    if blend == "multiply":
        # الحبر على الورق يضرب ما تحته بدل أن يغطيه، فيبقى أثر الإضاءة والملمس
        base_rgb = np.asarray(base.convert("RGB"), float) / 255
        logo_rgb = np.asarray(warped.convert("RGB"), float) / 255
        mask = (np.asarray(a, float) / 255)[..., None]
        out = base_rgb * (1 - mask) + (base_rgb * logo_rgb) * mask
        return Image.fromarray((out*255).astype("uint8"))
    base = base.convert("RGBA")
    base.paste(warped, (0, 0), a)
    return base.convert("RGB")

def load(p, size=None):
    im = Image.open(p).convert("RGBA")
    return im.resize((size, size), Image.LANCZOS) if size else im

if __name__ == "__main__":
    ink, gold = load("kha-ink.png"), load("kha-gold.png")
    seal_ink, seal_gold = load("seal-ink.png"), load("seal-gold.png")
    out = {}

    # 01 · لوحة الواجهة — حوافها الأربع من الصورة
    b = Image.open("raw/1-storefront.png").convert("RGB")
    panel = [(572,120), (850,58), (850,352), (572,374)]
    out["1-storefront.png"] = place(b, ink, on_plane(panel, .42), .85, "multiply")

    # 05 · غطاء العلبة
    b = Image.open("raw/5-boxset.png").convert("RGB")
    lid = [(68,332), (365,233), (600,383), (300,505)]
    out["5-boxset.png"] = place(b, ink, on_plane(lid, .46), .82, "multiply")

    # 06 · وجه الكيس
    b = Image.open("raw/6-bag.png").convert("RGB")
    face = [(300,420), (700,420), (700,760), (300,760)]
    out["6-bag.png"] = place(b, ink, on_plane(face, .46), .84, "multiply")

    # 08 · الغطاء الداخلي لعلبة الهدية
    b = Image.open("raw/8-giftbox.png").convert("RGB")
    inner = [(330,180), (700,180), (700,470), (330,470)]
    out["8-giftbox.png"] = place(b, gold, on_plane(inner, .40), .92)

    # 07 · الختم على البطاقة
    b = Image.open("raw/7-stationery.png").convert("RGB")
    card = [(100,150), (392,150), (392,830), (100,830)]   # البطاقة اليسرى وحدها
    out["7-stationery.png"] = place(b, seal_ink, on_plane(card, .42, (0,-0.34)), .80, "multiply")

    for name, im in out.items():
        im.save("out-" + name); print("out-" + name)
