import json, io, os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
D = json.load(io.open('hareketler-small.json', encoding='utf-8'))

P = [("Machine_Bench_Press", "3 × 12", "+2 rampa seti", "Bench press"),
     ("Wide-Grip_Lat_Pulldown", "3 × 12", "+1 hafif set", "Lat pull-downs"),
     ("Leg_Press", "3 × 12", "+1 hafif set", "Leg presses"),
     ("Leverage_Shoulder_Press", "3 × 12", "", "Shoulder presses"),
     ("Machine_Bicep_Curl", "3 × 12", "", "Arm curls"),
     ("Dead_Bug", "3 × 12", "", "Dead bug")]

B = [("Butterfly", "3 × 12", "+2 rampa seti", "Butterfly (hazır listede)"),
     ("Leverage_Iso_Row", "3 × 12", "+1 hafif set", "Row-Pull (özel)"),
     ("Barbell_Hip_Thrust", "3 × 12", "+1 hafif set", "Hip thrust — özel aç"),
     ("Seated_Leg_Curl", "3 × 12", "", "Leg curls"),
     ("Machine_Triceps_Extension", "3 × 12", "", "Arm extensions"),
     ("Pallof_Press", "3 × 12", "her yön", "Pallof press")]

A = [("Leverage_Incline_Chest_Press", "3 × 12", "+2 rampa seti", "Bench press"),
     ("Close-Grip_Front_Lat_Pulldown", "3 × 12", "+1 hafif set", "Lat pull-downs"),
     ("Leg_Press", "3 × 12", "+1 hafif set", "Leg presses"),
     ("Calf_Press_On_The_Leg_Press_Machine", "3 × 12", "", "Calf press — özel aç"),
     ("Side_Lateral_Raise", "3 × 12", "", "Lateral raises"),
     ("Machine_Bicep_Curl", "3 × 12", "", "Arm curls"),
     ("Machine_Triceps_Extension", "3 × 12", "", "Arm extensions"),
     ("Dead_Bug", "3 × 12", "", "Dead bug")]


def cards(rows, gun):
    out = []
    for n, (eid, sets, extra, watch) in enumerate(rows, 1):
        e = D[eid]
        frames = ''.join('<img src="%s" alt="" class="f%d">' % (f, j) for j, f in enumerate(e['frames']))
        extra_html = '<span class="extra">%s</span>' % extra if extra else ''
        out.append(
            '      <li class="move">\n'
            '        <div class="shot" aria-hidden="true">%s</div>\n'
            '        <div class="row">\n'
            '        <div class="body">\n'
            '          <p class="no">%s%d</p>\n'
            '          <h3>%s</h3>\n'
            '          <p class="meta">%s · %s</p>\n'
            '          <p class="cue">%s</p>\n'
            '          <p class="watch">Saatte: <b>%s</b></p>\n'
            '        </div>\n'
            '        <div class="dose"><span class="sets">%s</span>%s</div>\n'
            '        </div>\n'
            '      </li>' % (frames, gun, n, e['name'], ' · '.join(e['primary']), e['equip'],
                             e['cue'], watch, sets, extra_html))
    return '\n'.join(out)


html = io.open('sablon.html', encoding='utf-8').read()
html = html.replace('__P__', cards(P, 'A')).replace('__B__', cards(B, 'B')).replace('__A__', cards(A, 'A′'))
io.open('seans.html', 'w', encoding='utf-8').write(html)
print('yazildi', len(html) // 1024, 'KB')
