"""يفصل قطع الدار الحقيقية عن خلفيتها البيضاء.

الطريقتان السابقتان فشلتا: الفصل بالسطوع أذاب الألماس لأنه أبيض مثل الخلفية،
والانتشار من الحواف ترك الفراغ المحصور داخل القلادة أبيض لأنه لا يتصل بالإطار.

الطريقة هنا: تُوسَم كل منطقة بيضاء متصلة، ثم تُعتبر خلفيةً كل منطقة كبيرة،
سواء لامست الإطار أم كانت محصورة داخل القطعة. أما البقع البيضاء الصغيرة فهي
لمعان داخل الحجر، فتبقى.
"""
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

THRESH = 243          # ما فوقه يُعدّ أبيض خلفية
MIN_BG_AREA = 1200    # أصغر من ذلك يُعدّ لمعاناً داخل الحجر لا خلفية


def knockout(path: str) -> Image.Image:
    im = Image.open(path).convert('RGB')
    lum = np.asarray(im, float).mean(axis=2)
    h, w = lum.shape
    white = lum >= THRESH
    seen = np.zeros((h, w), bool)
    background = np.zeros((h, w), bool)

    for sy in range(h):
        for sx in range(w):
            if not white[sy, sx] or seen[sy, sx]:
                continue
            component, q = [], deque([(sy, sx)])
            seen[sy, sx] = True
            while q:
                y, x = q.popleft()
                component.append((y, x))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            if len(component) >= MIN_BG_AREA:
                for y, x in component:
                    background[y, x] = True

    alpha = Image.fromarray(np.where(background, 0, 255).astype('uint8'))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.7))
    out = Image.merge('RGBA', (*im.split(), alpha))
    return out.crop(alpha.point(lambda v: 255 if v > 10 else 0).getbbox())


if __name__ == '__main__':
    SRC = '/Users/halawa/code/Elkhamees-/assets/catalogue/'
    for name in ('marquise-collar-necklace.jpg', 'pear-drop-necklace.jpg',
                 'cascade-earrings.jpg', 'pear-quartet-ring.jpg',
                 'flower-tennis-bracelet.jpg', 'cluster-bracelet.jpg'):
        try:
            out = knockout(SRC + name)
            out.save('jewels/' + name.replace('.jpg', '.png'))
            print(name, '->', out.size)
        except Exception as error:
            print('skip', name, error)
