/**
 * Zar kural bozuyor mu? Her sistemin her günü için 2000 tur at, denetçiyi çalıştır.
 * Tek bir tur bile kırmızıysa test düşer - "rastgele ama doğru" iddiasının kanıtı budur.
 */
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

await import('./plan.js')
const Plan = globalThis.Plan
const EX = JSON.parse(readFileSync(new URL('./rows.json', import.meta.url), 'utf8'))

const TUR = 2000
let toplamTur = 0
const gorulen = new Map()

for (const [sistemId, sistem] of Object.entries(Plan.SISTEMLER)) {
  console.log(`\n${sistem.ad}`)
  for (let gun = 0; gun < sistem.gunler.length; gun++) {
    const g = sistem.gunler[gun]
    let kirmizi = 0
    let tekrar = 0
    let onceki = []

    for (let i = 0; i < TUR; i++) {
      const s = Plan.roll(EX, { sistem: sistemId, gun, avoid: onceki })
      const sonuc = Plan.check(EX, s, { sistem: sistemId, gun })
      if (sonuc.some((r) => !r.ok)) {
        kirmizi++
        if (kirmizi === 1) console.error('KIRMIZI:', JSON.stringify(sonuc.filter((r) => !r.ok)))
      }
      tekrar += s.filter((x) => onceki.includes(x.id)).length
      for (const x of s) gorulen.set(x.id, (gorulen.get(x.id) ?? 0) + 1)
      onceki = s.map((x) => x.id)
      toplamTur++
    }

    assert.equal(kirmizi, 0, `${sistem.ad} / ${g.ad}: ${kirmizi} tur kural bozdu`)
    const havuzlar = g.slots.map((sl) => Plan.havuz(EX, sl).length)
    assert.ok(Math.min(...havuzlar) > 0, `${g.ad}: bir slotun havuzu boş`)
    console.log(
      `  ${g.ad.padEnd(22)} ${String(Plan.agirlikHedefi(g)).padStart(2)} set · ` +
      `${g.slots.length} slot · havuz ${Math.min(...havuzlar)}-${Math.max(...havuzlar)} · ` +
      `kural bozan ${kirmizi} · hafta tekrarı ${tekrar}`,
    )
  }
}

// Yasaklı ve ısınma hareketleri hiçbir sistemde seçilmemeli.
for (const id of [...Object.keys(Plan.YASAK), ...Plan.ISINMA]) {
  assert.equal(gorulen.get(id), undefined, `${id} zara düştü ama havuz dışı olmalıydı`)
}

// Bölünmüş sistemin haftalık set dağılımı programın kas başına hedefine oturuyor mu (PROGRAM §80).
const HEDEF = { gogus: 9, sirt: 9, omuz: 6, kol: 6, quad: 6, arka: 5, baldir: 3 }
const haftalikKas = {}
for (const g of Plan.SISTEMLER.bolunmus.gunler) {
  for (const sl of g.slots) {
    if (sl.core) continue
    const kas = sl.key.replace(/[0-9]+$/, '')
    haftalikKas[kas] = (haftalikKas[kas] ?? 0) + sl.sets
  }
}
assert.deepEqual(haftalikKas, HEDEF, 'bölünmüş sistemin haftalık set dağılımı programın hedefinden sapıyor')

console.log(`\n${toplamTur} tur, kural bozan 0, havuz dışı hareket 0`)
console.log('bölünmüş haftalık set dağılımı:', JSON.stringify(haftalikKas))
console.log(`farklı hareket görüldü: ${gorulen.size}`)

// --- haftalık zar ---
for (const sistemId of Object.keys(Plan.SISTEMLER)) {
  let kirmizi = 0
  let sonHafta = []
  for (let i = 0; i < 1000; i++) {
    const hafta = Plan.rollWeek(EX, { sistem: sistemId, gunler: [1, 3, 5], avoid: sonHafta })
    const sonuc = Plan.checkWeek(hafta)
    if (sonuc.some((r) => !r.ok)) {
      kirmizi++
      if (kirmizi === 1) console.error('HAFTA KIRMIZI:', sistemId, JSON.stringify(sonuc.filter((r) => !r.ok)))
    }
    // her seans kendi kural setini de geçmeli
    for (const s of hafta) {
      const c = Plan.check(EX, s.session, { sistem: sistemId, gun: s.gunIndex })
      if (c.some((r) => !r.ok)) kirmizi++
    }
    sonHafta = hafta.flatMap((h) => h.session.map((x) => x.id))
  }
  assert.equal(kirmizi, 0, `${sistemId}: haftalık zar ${kirmizi} kez kural bozdu`)
  console.log(`haftalık zar · ${Plan.SISTEMLER[sistemId].ad}: 1000 hafta, kural bozan 0`)
}

// Makine crunch, dead bug/Pallof dururken seçilmemeli.
let crunch = 0
for (let i = 0; i < 1000; i++) {
  const s = Plan.roll(EX, { sistem: 'tumVucut' })
  if (s.some((x) => x.id === 'Ab_Crunch_Machine')) crunch++
}
assert.equal(crunch, 0, `makine crunch ${crunch} kez seçildi, ikincil olmalıydı`)
console.log('makine crunch 1000 turda 0 kez seçildi (dead bug / Pallof / kablo crunch önde)')
