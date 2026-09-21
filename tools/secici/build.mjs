/**
 * Seçici artifact'inin yeniden üretilebilir kısmı: katalog satırları ve hareket görselleri.
 * Görseller repoya girmez (2.8 MB, upstream CDN'de duruyor) - yayından önce bu betik indirir.
 *
 *   node tools/secici/build.mjs
 *
 * Sonra artifact şu dosyalarla yayınlanır: secici.html (sayfa) + plan.js + img/*.jpg.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

const catalog = JSON.parse(await readFile(join(root, 'apps/web/src/data/exercises.json'), 'utf8'))

// Sayfanın ihtiyacı olan alanlar: id, ad, alet, kaslar, ipucu. Gerisi taşınmıyor.
const rows = catalog.exercises.map((e) => ({ id: e.id, n: e.name, eq: e.equipment_tr, m: e.primary_tr, c: e.cue }))
await writeFile(join(here, 'rows.json'), JSON.stringify(rows))
console.log(`rows.json: ${rows.length} hareket`)

const imgDir = join(here, 'img')
await mkdir(imgDir, { recursive: true })

let indi = 0
let atlandi = 0
await Promise.all(
  catalog.exercises.map(async (e) => {
    const url = e.media[0]?.url
    if (!url) return
    const target = join(imgDir, `${e.id}.jpg`)
    if (existsSync(target)) { atlandi++; return }
    const res = await fetch(url)
    if (!res.ok) { console.error(`FAIL ${e.id} ${res.status}`); return }
    await writeFile(target, Buffer.from(await res.arrayBuffer()))
    indi++
  }),
)
console.log(`görsel: ${indi} indi, ${atlandi} zaten vardı → ${imgDir}`)
