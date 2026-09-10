// Telefonu tek seferde baglar: token'i linkin icine koyar ve QR olarak basar.
// Token hicbir yere yazilmaz, ekranda kalir; uygulama ilk acilista kaydedip
// adres cubugundan siler (apps/web/src/main.tsx).
//
//   npm run link              -> canli PWA (Pages + fit.evaitec.com)
//   npm run link -- --lan     -> ev agindaki API, tarayici yine Pages'ten acilir
//   npm run link -- --show    -> linki duz metin de bas (token gorunur olur)
import { readFileSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import qr from 'qrcode-terminal'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** .env'i okur. Kaynak tek: uygulamanin kendi API_TOKEN'i, kopyasi cikarilmaz. */
function readEnv(name) {
  const line = readFileSync(join(root, '.env'), 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${name}=`))
  if (!line) throw new Error(`${name} .env icinde yok`)
  const value = line.slice(name.length + 1).trim()
  if (!value) throw new Error(`${name} bos`)
  return value
}

/** Ev agindaki adres; telefon ayni agdayken tunel yerine bunu kullanmak daha hizli. */
function lanAddress() {
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return null
}

const PWA = 'https://evatechnosoft.github.io/life-os-wellness/'
const token = readEnv('API_TOKEN')
const lan = process.argv.includes('--lan')

const params = new URLSearchParams({ token })
if (lan) {
  const host = lanAddress()
  if (!host) throw new Error('LAN adresi bulunamadi')
  params.set('api', `http://${host}:3011`)
}
const link = `${PWA}?${params}`

qr.generate(link, { small: true }, (code) => {
  console.log(`\n${code}`)
  // Link duz metin olarak basilmaz: terminal ciktisi loglara, transcript'e ve omuz
  // ustune dusuyor, icinde de API token var. Gercekten gerekiyorsa: --show
  console.log(process.argv.includes('--show') ? `  ${link}\n` : '  (link QR icinde; duz metin icin --show)\n')
  console.log('  Telefonun kamerasiyla QR\'i okut. Ilk acilista token kaydedilir ve')
  console.log('  adresten silinir. Sonra menuden "Ana ekrana ekle".')
  console.log(lan ? '  API: ev agi (--lan)\n' : '  API: https://fit.evaitec.com\n')
})
