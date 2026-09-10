# AGENTS — life-os-wellness

Bu repoda çalışan her ajanın önce okuduğu çalışma kuralları. Ürün gereksinimi
`docs/SPEC.md`, ortak repo düzeni `REPO-STANDARD.md`.

## Kilitli kararlar (tartışmaya kapalı, spec sahibi değiştirir)

- **F0 = PWA.** Health Connect web'e açık değil; otomatik sync F1'de Capacitor ile gelir.
  Kotlin/Flutter'a geçiş F0'ı çöpe atar — önerme.
- **Offline-first.** Her yazma önce IndexedDB'ye, sonra `outbox` üzerinden sunucuya.
  Ağ yokken kayıt kaybı bu uygulamanın tek gerçek başarısızlık modudur.
- **Manuel giriş kalıcı katmandır**, geçici çözüm değil.
- **Kalori/besin veritabanı kapsam dışı.** Protein gramı yeterli.
- **Karar birimi 7-gün hareketli ortalamadır**, günlük kilo değil.
- **Tek kullanıcı.** Auth sistemi yok, tek statik bearer token yeterli.

## Sınırlar

- Giriş akışı 60 saniyeyi aşacak hiçbir UI eklenmez.
- Yeni bağımlılık: önce stdlib/mevcut paket denenir, gerekçesi PR'da yazılır.
- Tarih hesabı `apps/web/src/lib/date.ts` üzerinden yapılır; `toISOString()` ile
  gün türetmek yasak (UTC kayması).
- Şema değişikliği yeni numaralı `db/00X_*.sql` ile; eski migration düzenlenmez.
- Secret kodda yok — `.env` (gitignored), örneği `.env.example`.

## Akış

- Branch: `feature/<ad>` · `fix/<ad>`; `dev → test → prod`, doğrudan push yok.
- Commit öncesi: `npm test` + `npm run typecheck --workspaces` yeşil.
- Hesaplama katmanı (ortalama, uyum yüzdesi, streak) TDD ile yazılır — hedef %100 kapsam.
- İddia = kanıt: "çalışıyor" demek için komut çıktısı gerekir.
