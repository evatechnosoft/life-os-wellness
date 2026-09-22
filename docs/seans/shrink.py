import base64, io as _io, json, io, os
from PIL import Image

os.chdir(os.path.dirname(os.path.abspath(__file__)))
D = json.load(io.open('hareketler.json', encoding='utf-8'))

WIDTH = 520          # kart genisligi ~420px, retina icin 520
QUALITY = 68
before = after = 0

for key, e in D.items():
    out = []
    for f in e['frames']:
        raw = base64.b64decode(f.split(',', 1)[1])
        before += len(raw)
        im = Image.open(_io.BytesIO(raw)).convert('RGB')
        if im.width > WIDTH:
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        buf = _io.BytesIO()
        im.save(buf, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        after += buf.tell()
        out.append('data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode())
    e['frames'] = out

json.dump(D, io.open('hareketler-small.json', 'w', encoding='utf-8'))
print('gorsel: %d KB -> %d KB' % (before // 1024, after // 1024))
