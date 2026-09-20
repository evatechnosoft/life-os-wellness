// Bir surumu evaitecOTA katalogunu koyar: APK'lari bu deponun release'inden alip
// evaglass-releases'e yukler, apps.json'daki wellness kayitlarini tazeler.
//
// Neden ayri bir adim: katalog baska bir depoda (evaglass-releases) ve elle
// guncelleniyordu. 0.7.1'de kaldi, arada on iki surum yayinlandi ve hicbiri
// telefonda gorunmedi. Bu betik o adimi tek komuta indiriyor.
//
//   node ops/publish_ota.mjs            # variables.gradle'daki surum
//   node ops/publish_ota.mjs 0.20.0
//
// `gh` ile kimlik dogrulanmis olmali. Idempotent: katalog zaten guncelse dokunmaz.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = 'evatechnosoft/life-os-wellness'
const CATALOG = 'evatechnosoft/evaglass-releases'

/** Son arguman { input } ise gh'nin stdin'ine verilir. */
const gh = (...args) => {
  const last = args.at(-1)
  const input = last !== null && typeof last === 'object' ? args.pop().input : undefined
  return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, input })
}

const version =
  process.argv[2] ??
  readFileSync(join(root, 'apps/web/android/variables.gradle'), 'utf8').match(/wellnessVersion = '(.+?)'/)?.[1]
if (!version) throw new Error('surum bulunamadi: variables.gradle icinde wellnessVersion yok')

// APK'nin kendi versionCode'u ile ayni formul (app/build.gradle). Katalog kurulu
// surumu bu sayiyla karsilastiriyor; kayarsa OTA guncellemeyi ya hic gormez ya
// da zaten kurulu olani yeniden onerir.
const [major, minor, patch] = version.split('.').map(Number)
const versionCode = major * 10000 + minor * 100 + patch
const tag = `wellness-v${version}`
const base = `https://github.com/${CATALOG}/releases/download/${tag}`

const dir = mkdtempSync(join(tmpdir(), 'wellness-ota-'))
gh('release', 'download', `v${version}`, '-R', SOURCE, '-p', '*.apk', '-D', dir, '--clobber')

const describe = (file) => {
  const path = join(dir, file)
  return {
    sizeBytes: statSync(path).size,
    sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
    downloadUrl: `${base}/${file}`,
  }
}
const phoneApk = `wellness-${version}.apk`
const wearApk = `wellness-wear-${version}.apk`
const today = new Date().toISOString().slice(0, 10)

const entries = {
  'wellness-phone': {
    id: 'wellness-phone', packageName: 'com.evaitec.wellness', versionCode,
    name: 'Wellness',
    tagline: 'Kilo, protein, antrenman ve saat verisi tek gunlukte; Eva sorar, sen onaylarsin.',
    platform: 'phone', icon: 'assets/wellness.svg', screenshots: [],
    version, releaseDate: today, ...describe(phoneApk),
    notes: 'Android 8+. Giris adresi https://fit.evaitec.com — Ayar > Sunucu alanina yalnizca token girilir. Health Connect izinleri telefon ayarlarindan verilir.',
  },
  'wellness-wear': {
    id: 'wellness-wear', packageName: 'com.evaitec.wellness', versionCode,
    name: 'Wellness Saat',
    tagline: 'Adim, nabiz ve antrenmani bilekten toplar; telefonla ayni gunluge yazar.',
    platform: 'watch', icon: 'assets/wellness.svg', screenshots: [],
    version, releaseDate: today, ...describe(wearApk),
    notes: 'Bu dosyayi telefona kurmayin; telefon uygulamasiyla ayni paket adini tasir.',
  },
}

// Release yoksa ac, varsa APK'lari uzerine yaz - ikinci kez calistirmak bozmasin.
try {
  gh('release', 'view', tag, '-R', CATALOG)
  gh('release', 'upload', tag, '-R', CATALOG, join(dir, phoneApk), join(dir, wearApk), '--clobber')
} catch {
  gh('release', 'create', tag, '-R', CATALOG, '--title', `Wellness ${version}`,
     '--notes', `Wellness ${version} — telefon ve saat APK'si.`,
     join(dir, phoneApk), join(dir, wearApk))
}

const file = gh('api', `repos/${CATALOG}/contents/apps.json`)
const { sha, content } = JSON.parse(file)
const catalog = JSON.parse(Buffer.from(content, 'base64').toString('utf8'))

let changed = false
for (const [id, entry] of Object.entries(entries)) {
  const at = catalog.apps.findIndex((a) => a.id === id)
  const current = at === -1 ? null : catalog.apps[at]
  // Ayni surumu yeniden yayinlamak yayin tarihini ileri atmasin; yoksa betik
  // her calistiginda "degisti" der ve katalog bos yere commit alir.
  if (current?.version === entry.version) entry.releaseDate = current.releaseDate
  if (JSON.stringify(current) === JSON.stringify(entry)) continue
  changed = true
  if (at === -1) catalog.apps.push(entry)
  else catalog.apps[at] = entry
}

if (!changed) {
  console.log(`katalog zaten ${version} — degisiklik yok`)
  process.exit(0)
}

catalog.updated = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
const body = JSON.stringify({
  message: `wellness ${version}`,
  content: Buffer.from(JSON.stringify(catalog, null, 2) + '\n', 'utf8').toString('base64'),
  sha,
})
gh('api', `repos/${CATALOG}/contents/apps.json`, '-X', 'PUT', '--input', '-', { input: body })
console.log(`katalog guncellendi: wellness ${version} (versionCode ${versionCode})`)
