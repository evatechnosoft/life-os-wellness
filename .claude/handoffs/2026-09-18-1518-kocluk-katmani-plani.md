# Handoff: Koçluk katmanı planı + tünel onarımı

> 2026-09-18 15:18 · `dev` @ `eda4e5a` · kod değişmedi, tek yeni dosya `docs/PLAN-COACH.md` (commit EDİLMEDİ)
> Önceki devir: `2026-09-17-2246-ayar-ui-radix-karari.md`

## Hedef

Dean'in isteği: Eva'yı danışılabilir bir **kişisel antrenör + diyetisyen** yapmak.
Kendi ifadesiyle sıra: "sırayla hepsi — koçluk persona ve skill dosyaya, PT katmanı
makine/dambıl ayrımı, cihaz gösterip uygun hareket, resim, kısa video, çalıştırdığı
bölge ve animasyon, gelişebilir yap, senkronu da düzelt."
Profil eksikleri için dördünü de seçti: hedef/geçmiş · sağlık-ilaç · sevdiği yiyecekler · ekipman-zaman.

## Doğrulanmış durum (tool çıktısı var)

- **Tünel ölüydü, kaldırıldı.** `wellness-tunnel` Exited(255), 17 Eyl 19:57'den beri
  `dial tcp 198.41.192.107:7844: network is unreachable`. `docker compose --profile tunnel up -d cloudflared`
  → 18 Eyl 07:18'de dört bağlantı da `Registered tunnel connection` (ist03/ist05/ist07).
  `https://fit.evaitec.com/health` → `{"ok":true}`, `/api/daily` → 401 (tokensiz, doğru).
- **Senkron hâlâ akmıyor.** `/api/daily?start=2026-09-15&end=2026-09-18` → `[]`, meals → `[]`.
  API logunda `fit.evaitec.com` host'lu yalnız 2 istek var, ikisi de benim test çağrım.
  **Tünel açıldığından beri telefondan tek istek gelmedi.**
- Sunucudaki en son veri 10–14 Eylül, sadece `steps`; hepsinin `created_at` 2026-09-16T07:05
  → o satırlar 16 Eylül ZIP aktarımından geldi, telefon hiç doğrudan yazmamış.
- `weight_kg` **tüm satırlarda null** → protein hedefi (`nutrition.ts`, 1.6–2.2 g/kg) hesaplanamıyor.
- Dean telefonun `fit.evaitec.com`'a baktığını **sözlü** söyledi (ekran görüntüsüyle doğrulanmadı).

## Kararlar ve gerekçe

- **Egzersiz kütüphanesi = `yuhonas/free-exercise-db`, Unlicense (kamu malı), 800+ hareket.**
  Alanlar: `equipment, primaryMuscles, secondaryMuscles, level, mechanic, instructions, images`
  (hareket başına başlangıç+bitiş karesi). Görseller repoda değil, raw.githubusercontent'te.
- **wger elendi** — AGPL (yazılım) + **CC-BY-SA 3.0 (veri/görsel)**. AGPL API tüketiminde bulaşmaz,
  onu fazladan saymıştım; asıl yük CC-BY-SA: hareket başına `license/author/source_url` taşımak,
  künye ekranı, ve **türev** (kırpma, kas vurgusu çizme) aynı lisansla yayınlama zorunluluğu.
  Repo public olduğu için bu teorik değil.
- **Dean'in açık sorusu (CEVAPSIZ):** "uygulama kişisel ve local olsa bile mi?"
  Verilen cevap: yükümlülük kullanımda değil **dağıtımda** doğar; public repoya commit = dağıtım,
  sunucu linkini başkasına vermek = dağıtım. **Açık kalan:** wger'de hazır **Türkçe** isim var mı —
  varsa elle `data/exercise-tr.json` eşlemesinden kurtarır ve kararı yeniden tarttırır. **Doğrulanmadı.**
- **Video yerine iki kare + CSS geçiş.** Hareketin bilgisi başlangıç/bitiş pozisyonunda;
  codec/boyut/lisans yükü yok. Şemada `media` dizisi açık bırakılıyor — sonra GIF/video eklenirse kart değişmez.
- Görseller **repoya girmez** (public repo), ilk gösterimde IndexedDB'ye cache → offline-first korunur.

## Koçluk tarafı (bu oturumda verilen, kayda değer)

- Takviye (L-karnitin 409 mg + garsinya + yeşil çay + guarana + yeşil kahve): **önerilmedi**.
  Dozlar etkili aralığın altında (karnitin maks etki 2000 mg/gün; klorojenik asit ≥500 mg/gün gerekiyor,
  etikette hiç yazmıyor) ve **garsinya+yeşil çay** DILIN'de 22 karaciğer hasarı vakasının 16'sını oluşturuyor.
  Dean şişeyi attı.
- **Dean 140/90 tansiyon ölçtü** (tek ölçüm, aynı gün çift porsiyon kahve içmiş — konfonde).
  Verilen yönerge: 7 gün sabah-akşam doğru teknikle ölç, ortalama 135/85 üstüyse hekim.
  COACH-PERSONA §2.2 "kalıcı tansiyon anormalliği → randevu" maddesi burada işledi.
- Öğle yemeği (haşlama dana + pilav + yoğurt + marul-domates) ≈ **50 g protein** tahmin edildi;
  uygulamada o an 21 g yazıyordu → giriş eksik ya da öğün öncesi. Eksik olan: lif/sebze (1/5 porsiyon) ve tuz.

## Tekrarlama

- wger'i "AGPL yüzünden elendi" diye anlatma — API tüketiminde AGPL bulaşmaz, gerekçe CC-BY-SA.
- Tüneli `docker compose restart` ile arama: `--profile tunnel` verilmeden konteyner hiç başlamıyor.
- Telefon senkronunu "düzeldi" sayma — API logunda telefondan gelen istek görülmeden kanıt yok.
- `/api/daily` query parametreleri `start`/`end`, `from`/`to` değil (400 döner).

## Next (tek adım)

Dean telefonda uygulamayı açıp ekranı aşağı çekip bıraksın (`PullToRefresh.tsx`, `eda4e5a`),
sonra `docker logs life-os-wellness-api-1 | grep fit.evaitec.com` ile telefondan gelen POST'u doğrula.
Düşerse S1 (profil: `db/006_profile.sql` + `lib/profile.ts` + bağlama profil satırı) başlar.
`docs/PLAN-COACH.md` onay bekliyor, commit edilmedi.
