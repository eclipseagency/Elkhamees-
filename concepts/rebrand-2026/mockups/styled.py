"""يضع قطع الدار الحقيقية داخل تغليف الدار.

اللقطات مولّدة فارغة عمداً، والقطع مفصولة من تصوير الدار نفسه، فالنتيجة
مشهد تسويقي حقيقي القطعة وحقيقي الشعار، والمولّد لا يرسم فيه إلا الخامة.
"""
from PIL import Image, ImageFilter
import numpy as np
from composite import place, on_plane, load

JEW = "../jewels/"


def drop(base, piece, box, scale=1.0, shadow=True):
    """يضع القطعة داخل مستطيل box=(x0,y0,x1,y1) محافظاً على نسبتها."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    p = piece.copy()
    p.thumbnail((int(w * scale), int(h * scale)), Image.LANCZOS)
    px = x0 + (w - p.width) // 2
    py = y0 + (h - p.height) // 2
    if shadow:
        sh = Image.new("RGBA", base.size, (0, 0, 0, 0))
        mask = p.getchannel("A").point(lambda v: int(v * 0.38))
        shadow_layer = Image.new("RGBA", p.size, (20, 6, 10, 255))
        shadow_layer.putalpha(mask)
        sh.paste(shadow_layer, (px + 6, py + 10), shadow_layer)
        sh = sh.filter(ImageFilter.GaussianBlur(9))
        base = Image.alpha_composite(base.convert("RGBA"), sh)
    base = base.convert("RGBA")
    base.paste(p, (px, py), p)
    return base


if __name__ == "__main__":
    ink, gold = load("kha-ink.png"), load("kha-gold.png")
    seal = load("seal-ink.png")
    collar = Image.open(JEW + "marquise-collar-necklace.png")
    drops  = Image.open(JEW + "pear-drop-necklace.png")
    ring   = Image.open(JEW + "pear-quartet-ring.png")
    ears   = Image.open(JEW + "cascade-earrings.png")

    # ---- 82 · لقطة علوية: الطقم كاملاً بقطعة حقيقية ----
    b = Image.open("raw/82-flat-empty.png").convert("RGB")
    b = drop(b, collar, (170, 150, 510, 615), .92)
    b = drop(b, ears,   (545, 380, 750, 615), .60)
    b = b.convert("RGB")
    lid = [(985, 130), (1175, 130), (1175, 360), (985, 360)]
    b = place(b, ink, on_plane(lid, .40), .80, "multiply")
    card = [(775, 485), (975, 485), (975, 625), (775, 625)]
    b = place(b, seal, on_plane(card, .46), .78, "multiply")
    b.save("styled-flatlay.png"); print("styled-flatlay.png")

    # ---- 83 · القطعة على العارضة ----
    b = Image.open("raw/83-bust-empty.png").convert("RGB")
    b = drop(b, drops, (330, 300, 700, 640), .95).convert("RGB")
    b.save("styled-bust.png"); print("styled-bust.png")

    # ---- 81 · القطعة داخل العلبة ----
    b = Image.open("raw/81-box-empty.png").convert("RGB")
    b = drop(b, collar, (200, 300, 900, 830), .80).convert("RGB")
    b.save("styled-box.png"); print("styled-box.png")


def cinematic():
    """المشاهد السينمائية: تُوضع فيها العلامة وقطعة حقيقية."""
    ink, gold = load("kha-ink.png"), load("kha-gold.png")
    seal = load("seal-ink.png")
    collar = Image.open(JEW + "marquise-collar-necklace.png")

    # 94 · الصينية والمجموعة على الحجر
    b = Image.open("raw/94-cine.png").convert("RGB")
    tray = [(662, 322), (1208, 268), (1252, 528), (698, 604)]
    b = place(b, collar, on_plane(tray, .74), .97)
    card = [(160, 402), (286, 393), (296, 512), (170, 522)]
    b = place(b, seal, on_plane(card, .42), .70, "multiply")
    lid94 = [(186, 44), (476, 28), (498, 100), (204, 120)]
    b = place(b, ink, on_plane(lid94, .30), .55, "multiply")
    b.save("cine-set.png"); print("cine-set.png")

    # 91 · العلبتان في الضوء الجانبي
    b = Image.open("raw/91-cine.png").convert("RGB")
    lid91 = [(196, 300), (566, 280), (600, 372), (222, 400)]
    b = place(b, ink, on_plane(lid91, .30), .48, "multiply")
    inner = [(714, 190), (966, 178), (972, 386), (720, 396)]
    b = place(b, gold, on_plane(inner, .32), .88)
    b.save("cine-boxes.png"); print("cine-boxes.png")

    # 93 · اللقطة القريبة
    b = Image.open("raw/93-cine.png").convert("RGB")
    lid93 = [(60, 400), (470, 330), (520, 560), (105, 660)]
    b = place(b, ink, on_plane(lid93, .30), .50, "multiply")
    b.save("cine-corner.png"); print("cine-corner.png")
