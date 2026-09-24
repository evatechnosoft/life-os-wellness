import type { Source } from './llm.ts'

/**
 * Tarif kaynaklarina gorsel: kaynak sayfanin og:image'i. Gemini yalniz Google'in
 * yonlendirme linkini veriyor; takip edip gercek adresi ve kapak resmini aliyoruz.
 *
 * Yalniz Google yonlendirmesi takip edilir - ev agindaki sunucudan kullanicinin
 * verdigi rastgele adrese istek atmak (SSRF) istemiyoruz.
 */
const REDIRECT_HOST = 'vertexaisearch.cloud.google.com'
const TIMEOUT_MS = 5000
const MAX_BYTES = 400_000
const MAX_SOURCES = 4

export async function withPreviews(sources: Source[], fetchFn: typeof fetch = fetch): Promise<Source[]> {
  return Promise.all(sources.map((s, i) => (i < MAX_SOURCES ? preview(s, fetchFn) : s)))
}

async function preview(source: Source, fetchFn: typeof fetch): Promise<Source> {
  let start: URL
  try {
    start = new URL(source.url)
  } catch {
    return source
  }
  if (start.hostname !== REDIRECT_HOST) return source
  try {
    const res = await fetchFn(start, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) })
    const final = new URL(res.url)
    if (final.protocol !== 'https:' || !res.ok) return source
    const html = await readCapped(res)
    const image = ogImage(html, final)
    return { ...source, url: final.toString(), ...(image ? { image } : {}) }
  } catch {
    // Kapak resmi suslemedir: alinamazsa kaynak linkiyle devam.
    return source
  }
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    size += value.length
  }
  void reader.cancel()
  return new TextDecoder().decode(Buffer.concat(chunks))
}

/** og:image (ya da twitter:image) meta etiketinden mutlak https adres. */
export function ogImage(html: string, base: URL): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/(?:property|name)\s*=\s*["'](?:og:image|twitter:image)["']/i.test(tag)) continue
    const content = /content\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    if (!content) continue
    try {
      const url = new URL(content.replace(/&amp;/g, '&'), base)
      if (url.protocol === 'https:') return url.toString()
    } catch {
      continue
    }
  }
  return null
}
