// Builds the Android debug APK. Picks a JDK 21+ itself, because Capacitor 8 needs it and
// the machine's JAVA_HOME may still point at an older JDK.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const web = join(root, 'apps', 'web')
const android = join(web, 'android')

function javaHome() {
  const current = process.env.JAVA_HOME
  if (current && majorVersion(join(current, 'bin', 'java.exe')) >= 21) return current

  const roots = [
    'C:/Program Files/Android/openjdk',
    'C:/Program Files/Microsoft',
    'C:/Program Files/Eclipse Adoptium',
    'C:/Program Files/Java',
    '/usr/lib/jvm',
  ]
  for (const base of roots) {
    if (!existsSync(base)) continue
    for (const entry of readdirSync(base).sort().reverse()) {
      const candidate = join(base, entry)
      const bin = join(candidate, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
      if (existsSync(bin) && majorVersion(bin) >= 21) return candidate
    }
  }
  throw new Error('JDK 21+ bulunamadi (Capacitor 8 sarti)')
}

function majorVersion(javaBin) {
  if (!existsSync(javaBin)) return 0
  // `java -version` writes to stderr, not stdout.
  const res = spawnSync(javaBin, ['-version'], { encoding: 'utf8' })
  const match = /version "(\d+)/.exec(`${res.stdout ?? ''}${res.stderr ?? ''}`)
  return match ? Number(match[1]) : 0
}

function run(command, args, cwd, env = {}) {
  const res = spawnSync(command, args, { cwd, stdio: 'inherit', shell: /\.(cmd|bat)$/i.test(command), env: { ...process.env, ...env } })
  if (res.status !== 0) process.exit(res.status ?? 1)
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const gradlew = process.platform === 'win32' ? join(android, 'gradlew.bat') : join(android, 'gradlew')

const JAVA_HOME = javaHome()
console.log(`JDK: ${JAVA_HOME}`)

run(npm, ['run', 'build', '-w', '@wellness/web'], root)
run(npx, ['cap', 'sync', 'android'], web)
run(gradlew, ['assembleDebug'], android, { JAVA_HOME })

const apk = join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
console.log(existsSync(apk) ? `\nAPK: ${apk}` : '\nAPK uretilmedi')
