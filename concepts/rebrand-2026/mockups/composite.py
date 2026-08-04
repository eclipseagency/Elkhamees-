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


def on_plane(corners, frac=0.5, shift=(0.0, 0.0), ratio=1.0):
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
        # ratio = ارتفاع الأصل ÷ عرضه، يحفظ نسبة التوقيع المستطيل
        u, v = u / nu * side, v / nv * side * ratio
    centre = centre + shift[0]*u + shift[1]*v
    s = frac / 2
    return [tuple(centre - s*u - s*v), tuple(centre + s*u - s*v),
            tuple(centre + s*u + s*v), tuple(centre - s*u + s*v)]

def place(base, logo, quad, opacity=1.0, blend="normal"):
    """يضع الشعار داخل رباعي الأضلاع quad = [TL, TR, BR, BL] بإحداثيات الصورة."""
    W, H = base.size
    # تصغير الشعار إلى حجم قريب من وجهته أولاً: التحويل المنظوري يأخذ عيّنة
    # واحدة لكل بكسل، فالتصغير الحاد داخله يبتلع الحروف الرفيعة
    import math as _m
    tw = _m.dist(quad[0], quad[1]); th = _m.dist(quad[0], quad[3])
    target = max(2, int(max(tw, th) * 2))
    if logo.width > target:
        logo = logo.resize((target, max(1, round(logo.height * target / logo.width))), Image.LANCZOS)
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
    # الأسطح الكبيرة تحمل التوقيع كاملاً، والصغيرة العلامة وحدها
    lock_ink = Image.open("../logo/lockup-ink.png").convert("RGBA")
    seal_ink, seal_gold = load("seal-ink.png"), load("seal-gold.png")
    out = {}

    # 01 · لوحة الواجهة — حوافها الأربع من الصورة
    b = Image.open("raw/1-storefront.png").convert("RGB")
    panel = [(572,120), (850,58), (850,352), (572,374)]
    out["1-storefront.png"] = place(b, lock_ink, on_plane(panel, .78, ratio=1413/2643), .85, "multiply")

    # 05 · غطاء العلبة
    b = Image.open("raw/5-boxset.png").convert("RGB")
    lid = [(68,332), (365,233), (600,383), (300,505)]
    out["5-boxset.png"] = place(b, ink, on_plane(lid, .46), .82, "multiply")

    # 06 · وجه الكيس
    b = Image.open("raw/6-bag.png").convert("RGB")
    # الحبل يمرّ في أعلى الوجه، فيُنزَل التوقيع تحته
    face = [(312,566), (688,566), (688,782), (312,782)]
    out["6-bag.png"] = place(b, lock_ink, on_plane(face, .86, ratio=1413/2643), .84, "multiply")

    # 08 · الغطاء الداخلي لعلبة الهدية
    b = Image.open("raw/8-giftbox.png").convert("RGB")
    # الغطاء مائل، فالمستطيل المسطّح كان يجعل العلامة تبدو ملصوقة ومزاحة
    inner = [(468,176), (849,139), (878,512), (483,549)]
    out["8-giftbox.png"] = place(b, gold, on_plane(inner, .34), .92)

    # 07 · الختم على البطاقة
    b = Image.open("raw/7-stationery.png").convert("RGB")
    card = [(100,150), (392,150), (392,830), (100,830)]   # البطاقة اليسرى وحدها
    out["7-stationery.png"] = place(b, seal_ink, on_plane(card, .42, (0,-0.34)), .80, "multiply")


    # 23 · المطبوعات على الخمري
    b = Image.open("raw/23-stationery-burgundy.png").convert("RGB")
    big = [(560,120), (930,120), (930,520), (560,520)]
    out["23-stationery-burgundy.png"] = place(b, seal_ink, on_plane(big, .40, (0,-0.22)), .82, "multiply")


    # 24 · علبة الهدية ببطانة خمرية
    b = Image.open("raw/24-giftbox-burgundy.png").convert("RGB")
    lid_b = [(206,198), (581,152), (624,545), (231,581)]
    out["24-giftbox-burgundy.png"] = place(b, gold, on_plane(lid_b, .30, (0,-0.10)), .92)


    # ---- عائلة التغليف بالبرجندي ----
    b = Image.open("raw/51-box.png").convert("RGB")
    lid51 = [(478,463), (731,336), (951,573), (695,707)]      # الغطاء المائل
    out["51-box.png"] = place(b, ink, on_plane(lid51, .40), .82, "multiply")

    b = Image.open("raw/52-bag.png").convert("RGB")
    face52 = [(150,610), (520,610), (520,800), (150,800)]      # تحت المقابض
    out["52-bag.png"] = place(b, lock_ink, on_plane(face52, .88, ratio=1413/2643), .84, "multiply")

    b = Image.open("raw/53-stat.png").convert("RGB")
    card53 = [(180,150), (575,150), (575,455), (180,455)]       # البطاقة المطوية
    out["53-stat.png"] = place(b, seal_ink, on_plane(card53, .34, (0,-0.18)), .80, "multiply")


    # 71 · الخاء محفورة في وجه المشبك: التفصيلة التي تتكرّر في القطعة نفسها
    b = Image.open("raw/71-clasp.png").convert("RGB")
    faceC = [(180,150), (900,95), (955,620), (225,700)]
    kha_engraved = load("kha-ink.png")
    out["71-clasp.png"] = place(b, kha_engraved, on_plane(faceC, .34), .34, "multiply")

    for name, im in out.items():
        im.save("out-" + name); print("out-" + name)
