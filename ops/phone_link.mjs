// Telefonu tek seferde baglar: token'i linkin icine koyar ve QR olarak basar.
// Token hicbir yere yazilmaz, ekranda kalir; uygulama ilk acilista kaydedip
// adres cubugundan siler (apps/web/src/main.tsx).
//
//   npm run link              -> canli PWA (Pages + fit.evaitec.com)
//   npm run link -- --lan     -> ev agindaki API, tarayici yine Pages'ten acilir
//   npm run link -- --show    -> linki duz metin de bas (token gorunur olur)
//   npm run link -- --lan --host 192.168.1.185  -> adresi elle ver
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

/**
 * Ev agindaki adres; telefon ayni agdayken tunel yerine bunu kullanmak daha hizli.
 * Makinede ZeroTier, WSL kopru ve hotspot arayuzleri de var; ilk bulunani almak
 * telefonun erisemedigi bir adres veriyordu. Ev agi (192.168.x) once, sonra
 * 172.16-31, en son 10.x; baglantisiz link-local (169.254) hic sayilmaz.
 */
function lanAddress() {
  const flag = process.argv.indexOf('--host')
  if (flag >= 0 && process.argv[flag + 1]) return process.argv[flag + 1]

  const found = []
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family !== 'IPv4' || net.internal) continue
      if (net.address.startsWith('169.254.')) continue
      found.push(net.address)
    }
  }
  const rank = (ip) => (ip.startsWith('192.168.') ? 0 : ip.startsWith('172.') ? 1 : 2)
  return found.sort((a, b) => rank(a) - rank(b))[0] ?? null
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
  if (lan) {
    console.log('  API: ev agi (--lan)')
    // Sayfa https, LAN adresi http: tarayici karisik icerigi engelliyor ve kayitlar
    // kuyrukta birikiyor. APK'da sorun yok (capacitor.config: allowMixedContent).
    console.log('  UYARI: bu link yalniz APK icin. Tarayicida karisik icerik engellenir,')
    console.log('  kayitlar sunucuya gitmez. Tarayici icin --lan olmadan calistir.\n')
  } else {
    console.log('  API: https://fit.evaitec.com\n')
  }
})
