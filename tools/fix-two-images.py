# -*- coding: utf-8 -*-
"""حالتان لا يحلّهما القناع العام:
   ring-pear.png — شفافيته سليمة لكن خلفيتها الزخرفية شمبانيا معتمة داخل الـalpha.
   bridal-set.jpg — بُست عرض بنفسجي على أسود؛ اللون خارج لوحة العلامة."""
from PIL import Image, ImageFilter
import numpy as np, sys
sys.path.insert(0, 'tools')
from importlib import import_module
norm = import_module('normalize-images')

# ١) خاتم الكمثرى: أسقط البكسلات الشمبانية من الـalpha. القطعة ذهب أبيض
#    وألماس، فلا ذهب أصفر نخشى على فقده.
im = Image.open('assets/ring-pear.png').convert('RGBA')
a = np.asarray(im).astype(np.int16)
r, g, b, al = a[...,0], a[...,1], a[...,2], a[...,3]
champagne = (r > 150) & ((r - b) > 38)
al2 = np.where(champagne, 0, al).astype(np.uint8)
out = np.dstack([a[...,:3].astype(np.uint8), al2])
Image.fromarray(out, 'RGBA').save('/tmp/ring-pear-clean.png')

# ٢) الطقم: البُست أزرق-بنفسجي (b > r). اسحبه إلى رمادي دافئ محايد
#    وأبقِ الذهب (r > b) كما هو.
im2 = Image.open('assets/bridal-set.jpg').convert('RGB')
c = np.asarray(im2).astype(np.float32)
r2, g2, b2 = c[...,0], c[...,1], c[...,2]
lum = (0.299*r2 + 0.587*g2 + 0.114*b2)
cool = np.clip((b2 - r2) / 40.0, 0, 1)[..., None]          # كم هو أزرق
neutral = np.dstack([lum*1.03, lum*0.99, lum*0.93])         # رمادي دافئ
c2 = c*(1-cool) + neutral*cool
Image.fromarray(np.clip(c2,0,255).astype(np.uint8)).save('/tmp/bridal-neutral.jpg', quality=95)
print('prepared')
