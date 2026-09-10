// Generates the PWA icons as flat PNGs so no binary asset has to live in git history.
// Run: node ops/gen_icons.mjs
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crc32 } from 'node:zlib'
import { deflateSync } from 'node:zlib'

const BG = [15, 23, 42]
const FG = [56, 189, 248]

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body) >>> 0)
  return Buffer.concat([length, body, crc])
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  const c = size / 2
  const outer = size * 0.34
  const inner = size * 0.2
  let offset = 0
  for (let y = 0; y < size; y += 1) {
    raw[offset] = 0 // filter: none
    offset += 1
    for (let x = 0; x < size; x += 1) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c)
      const color = d < outer && d > inner ? FG : BG
      raw[offset] = color[0]
      raw[offset + 1] = color[1]
      raw[offset + 2] = color[2]
      offset += 3
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'web', 'public')
for (const size of [192, 512]) {
  const file = join(out, `icon-${size}.png`)
  writeFileSync(file, png(size))
  console.log(`wrote ${file}`)
}
