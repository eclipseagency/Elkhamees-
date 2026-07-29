# -*- coding: utf-8 -*-
"""تدرّج لوني موحّد للقطات الأجواء.
صور القطع وُحّدت بالعزل على خلفية واحدة؛ لقطات الأجواء لا يمكن عزلها،
فتُوحَّد بالمعالجة اللونية: إشباع أقل، دفء ثابت، وتباين واحد — حتى تقرأ
الأربع كحملة واحدة لا كصور مجمّعة. الأصول لا تُمسّ."""
from PIL import Image
import numpy as np, sys, os

SAT     = 0.72     # خفض الإشباع — الألوان الصارخة هي ما يفكّك الشبكة
WARM    = (1.045, 1.0, 0.945)   # دفء ثابت على كل صورة
LIFT    = 10       # رفع الظلال قليلاً (مظهر فيلمي لا أسود ميّت)
TARGET  = 132      # توحيد متوسط الإضاءة
PULL    = 0.55     # قوة السحب نحو الإضاءة الهدف

def grade(src, dst, ratio=None):
    im = Image.open(src).convert('RGB')
    if ratio:                                   # قصّ مركزي لنسبة موحّدة
        w, h = im.size; want = ratio[0]/ratio[1]
        if w/h > want:  nw = int(h*want); im = im.crop(((w-nw)//2, 0, (w-nw)//2+nw, h))
        else:           nh = int(w/want); im = im.crop((0, (h-nh)//2, w, (h-nh)//2+nh))
    a = np.asarray(im).astype(np.float32)
    lum = (0.299*a[...,0] + 0.587*a[...,1] + 0.114*a[...,2])[..., None]
    a = lum + (a - lum)*SAT                     # إشباع
    a = a * np.array(WARM, np.float32)          # دفء
    a = LIFT + a*(255-LIFT)/255                 # رفع الظلال
    cur = a.mean()
    a = a * (1 + PULL*((TARGET/cur) - 1))       # توحيد الإضاءة
    x = np.clip(a, 0, 255)/255
    x = np.clip(x + 0.12*x*(1-x)*(x-0.5)*2, 0, 1)   # منحنى S خفيف
    Image.fromarray((x*255).astype(np.uint8)).save(dst, quality=90, subsampling=1)
    print(f"  {os.path.basename(dst):26s} mean {cur:6.1f} -> {(x*255).mean():6.1f}")

if __name__ == '__main__':
    print('lifestyle grade:')
    for src, ratio in [('assets/model-gold.jpg',(3,4)), ('assets/concept-v2/campaign-hero.jpg',(3,4)),
                       ('assets/necklace-box.jpg',(3,4)), ('assets/model-necklace.jpg',(3,4))]:
        grade(src, 'assets/editorial/'+os.path.splitext(os.path.basename(src))[0]+'.jpg', ratio)
    # الهيرو وصورة الفئات بنسبهما الأصلية
    for src in ['assets/hero-collection.webp', 'assets/model-necklace.jpg']:
        if os.path.exists(src):
            grade(src, 'assets/editorial/'+os.path.splitext(os.path.basename(src))[0]+'-wide.jpg', None)
