// Playwright smoke for the built web app: node tools/web_smoke/smoke.mjs [dist-dir]
// Serves apps/web/dist, boots headless; fails on uncaught page errors or if the app
// shell never renders. Proves the Remote Config init cannot break or block startup.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { chromium } from 'playwright'

const root = resolve(process.argv[2] ?? 'apps/web/dist')
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const file = join(root, normalize(path === '/' ? '/index.html' : path))
  if (!file.startsWith(root)) return void res.writeHead(403).end()
  try {
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(await readFile(file))
  } catch { res.writeHead(404).end() }
}).listen(0)
const url = `http://127.0.0.1:${server.address().port}/`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 412, height: 915 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 160)) })

let ok = false
try {
  await page.goto(url)
  await page.waitForSelector('[role="tablist"]', { timeout: 30000 })
  await page.waitForTimeout(5000) // let background Remote Config init run
  await page.screenshot({ path: 'smoke.png' })
  ok = errors.length === 0
} catch (e) {
  errors.push(String(e))
}
console.log(ok ? 'SMOKE PASS' : `SMOKE FAIL\n${errors.join('\n')}`)
await browser.close()
server.close()
process.exit(ok ? 0 : 1)
