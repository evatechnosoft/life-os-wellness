// Egzersiz kutuphanesini uretir: upstream'i ceker, alanlari kirpar, Turkce eslemeyi uygular.
// Kaynak: yuhonas/free-exercise-db (Unlicense - kamu mali, atif zorunlu degil).
// Gorseller repoya GIRMEZ; istemci ilk gosterimde CDN'den cekip IndexedDB'ye yazar.
// Kullanim: node scripts/build-exercises.mjs
import { readFile, writeFile } from 'node:fs/promises'

const UPSTREAM = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
export const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

/** Upstream kaydindan tasinan alanlar. Geri kalani (category, force) tasinmiyor - kullanan yok. */
export function shape(raw, tr) {
  const meta = tr.exercises[raw.id]
  return {
    id: raw.id,
    name: meta.name,
    name_en: raw.name,
    // Esneme/mobilite kayitlarinda upstream equipment ve mechanic null birakiyor;
    // ekran equipment_tr'yi dogrudan yaziyor - null gecerse kartta "null" gorunur.
    equipment: raw.equipment ?? 'body only',
    equipment_tr: tr.equipment[raw.equipment ?? 'body only'] ?? raw.equipment,
    level: raw.level,
    mechanic: raw.mechanic ?? 'other',
    primary: raw.primaryMuscles,
    secondary: raw.secondaryMuscles,
    primary_tr: raw.primaryMuscles.map((m) => tr.muscles[m] ?? m),
    secondary_tr: raw.secondaryMuscles.map((m) => tr.muscles[m] ?? m),
    instructions: raw.instructions,
    // Elle eklenen iki alan - upstream'de karsiligi yok:
    // load = yuk binen / korunacak nokta, cue = tek cumlelik Turkce uyari.
    // Kare basina fotograf uzeri vurgu. Bos dizi = henuz karelere bakilmadi,
    // ekran o zaman yalniz figure duser.
    focus: meta.focus ?? [],
    load: meta.load,
    cue: meta.cue,
    // Iki kare: baslangic ve bitis. Kart ikisini capraz gecisle oynatir; video yok.
    // Dizi kasten acik - yarin GIF/video eklenirse kart degil kaynak degisir.
    // Kendi cekimimiz varsa upstream kareleri yerine o gecer (tek GIF de olabilir).
    // Kaynak degisir, kart degismez - `media` dizisi bunun icin acik birakildi.
    media: meta.media ?? raw.images.map((p) => ({ type: 'image', url: IMAGE_BASE + p })),
  }
}

async function main() {
  const tr = JSON.parse(await readFile(new URL('../data/exercise-tr.json', import.meta.url), 'utf8'))
  const res = await fetch(UPSTREAM)
  if (!res.ok) throw new Error(`upstream ${res.status}`)
  const all = await res.json()

  const wanted = new Set(Object.keys(tr.exercises))
  const picked = all.filter((e) => wanted.has(e.id)).map((e) => shape(e, tr))

  const missing = [...wanted].filter((id) => !picked.some((p) => p.id === id))
  if (missing.length > 0) throw new Error(`upstream'de bulunamadi: ${missing.join(', ')}`)

  const out = {
    source: 'yuhonas/free-exercise-db',
    license: 'Unlicense (public domain)',
    generated: new Date().toISOString().slice(0, 10),
    exercises: picked.sort((a, b) => a.id.localeCompare(b.id)),
  }
  await writeFile(new URL('../apps/web/src/data/exercises.json', import.meta.url), JSON.stringify(out, null, 2) + '\n')
  console.log(`${picked.length} hareket yazildi -> apps/web/src/data/exercises.json`)
}

await main()
