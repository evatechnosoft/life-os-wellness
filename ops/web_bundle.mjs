// Writes bundle.json into a built web dir: content version, file list, and the APK
// versionCode it needs (lib/webBundle.ts). Run after `vite build` for both the APK
// and the fit.evaitec.com/bundle/ copy, so the phone can tell whether they differ.
//   node ops/web_bundle.mjs apps/web/dist
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const dir = process.argv[2]
if (!dir) throw new Error('kullanim: node ops/web_bundle.mjs <dist dizini>')

const gradle = readFileSync(new URL('../apps/web/android/variables.gradle', import.meta.url), 'utf8')
const version = gradle.match(/wellnessVersion = '(\d+)\.(\d+)\.(\d+)'/)
if (!version) throw new Error('surum bulunamadi: variables.gradle icinde wellnessVersion yok')
// Same formula as app/build.gradle versionCode.
const minNative = Number(version[1]) * 10000 + Number(version[2]) * 100 + Number(version[3])

const files = readdirSync(dir, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => relative(dir, join(e.parentPath, e.name)).split(sep).join('/'))
  .filter((f) => f !== 'bundle.json')
  .sort()

const hash = createHash('sha256')
for (const f of files) hash.update(f).update(readFileSync(join(dir, f)))
const manifest = { version: hash.digest('hex').slice(0, 16), min_native: minNative, files }
writeFileSync(join(dir, 'bundle.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`bundle.json: ${manifest.version} · ${files.length} dosya · min_native ${minNative}`)
