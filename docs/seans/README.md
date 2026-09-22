# Seans kartı (A · B · A′)

Salonda telefondan açılan tek dosyalık HTML. Görseller base64 gömülü, internetsiz çalışır.

    python build_seans.py    # sablon.html + hareketler-small.json -> seans.html

- `hareketler-small.json` — free-exercise-db görselleri 520 px'e indirilmiş hâli (`shrink.py` üretir).
  Artifact CSP dış görsele izin vermediği için gömmek zorunlu.
- Set/tekrar dozu `build_seans.py` içindeki P (A günü), B, A listelerinde; sunucudaki
  `workout_plan` ile aynı tutulmalı.
- Yayın: Artifact olarak https://claude.ai/code/artifact/9396efa4-9d1b-49d3-aa05-8b222e066617
