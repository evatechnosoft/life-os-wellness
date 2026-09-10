// One command to bring the whole stack up on the LAN: db -> migrations -> api -> web.
// Run: npm start
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const children = []

// Only .cmd shims (npm on Windows) need a shell; running an .exe through one breaks
// on paths with spaces, e.g. C:\Program Files\nodejs\node.exe.
const needsShell = (command) => command.endsWith('.cmd')

function run(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: needsShell(command), ...opts })
    child.on('error', reject)
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} -> exit ${code}`))))
  })
}

function background(command, args, env) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: needsShell(command),
    env: { ...process.env, ...env },
  })
  children.push(child)
  return child
}

function ensureEnv() {
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) {
    const template = readFileSync(join(root, '.env.example'), 'utf8')
    writeFileSync(envPath, template.replace('API_TOKEN=change-me', `API_TOKEN=${randomBytes(16).toString('hex')}`))
    console.log('.env olusturuldu (API_TOKEN rastgele uretildi)')
  }
  const env = Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split('\n')
      .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
      .map((line) => {
        const at = line.indexOf('=')
        return [line.slice(0, at).trim(), line.slice(at + 1).trim()]
      }),
  )
  if (env.API_TOKEN === 'change-me') {
    const token = randomBytes(16).toString('hex')
    writeFileSync(envPath, readFileSync(envPath, 'utf8').replace('API_TOKEN=change-me', `API_TOKEN=${token}`))
    env.API_TOKEN = token
    console.log('API_TOKEN varsayilandi, rastgele bir tokenla degistirildi')
  }
  return env
}

function lanAddress() {
  const candidates = []
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family !== 'IPv4' || addr.internal) continue
      // Skip Docker/WSL/Hyper-V bridges: the phone cannot reach those.
      const virtual = /docker|vethernet|wsl|virtual|loopback/i.test(name)
      candidates.push({ address: addr.address, name, virtual })
    }
  }
  const preferred = candidates.find((c) => !c.virtual && /^192\.168\./.test(c.address))
    ?? candidates.find((c) => !c.virtual)
    ?? candidates[0]
  return preferred?.address ?? 'localhost'
}

async function waitForHealth(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  return false
}

process.on('SIGINT', () => {
  for (const child of children) child.kill()
  process.exit(0)
})

const env = ensureEnv()

console.log('1/4 postgres')
await run('docker', ['compose', 'up', '-d', '--wait', 'db'])

console.log('2/4 migration')
await run(process.execPath, ['--env-file=.env', 'db/migrate.js'])

console.log('3/4 api')
background(process.execPath, ['--env-file=.env', 'apps/api/src/index.ts'])
const apiPort = env.API_PORT ?? '3011'
if (!(await waitForHealth(`http://127.0.0.1:${apiPort}/health`))) {
  console.error('API ayaga kalkmadi, cikiliyor')
  for (const child of children) child.kill()
  process.exit(1)
}

console.log('4/4 web (build + preview)')
await run(npm, ['run', 'build', '-w', '@wellness/web'])
background(npm, ['run', 'preview', '-w', '@wellness/web'])

const host = lanAddress()
const link = `https://${host}:4173/?token=${env.API_TOKEN}`
await new Promise((r) => setTimeout(r, 2500))
console.log(`
Hazir.

  Telefon / bu makine:  ${link}

  Ilk acilista tarayici self-signed sertifika uyarisi verir -> "Gelismis / Yine de devam".
  Sonra menuden "Ana ekrana ekle" -> uygulama gibi tam ekran acilir, cevrimdisi calisir.
  Token linkin icinde; ilk acilista kaydedilir ve adresten silinir.

  Durdurmak icin Ctrl+C (postgres arka planda kalir: docker compose down)
`)
