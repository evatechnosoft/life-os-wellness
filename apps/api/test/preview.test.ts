import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { ogImage, withPreviews } from '../src/preview.ts'

const base = new URL('https://yemek.example/tarif/visneli')

describe('ogImage', () => {
  test('og:image, attribute order does not matter, relative made absolute', () => {
    assert.equal(ogImage('<meta property="og:image" content="https://cdn.example/a.jpg">', base), 'https://cdn.example/a.jpg')
    assert.equal(ogImage('<meta content="/img/b.jpg" property="og:image" />', base), 'https://yemek.example/img/b.jpg')
    assert.equal(ogImage('<meta name="twitter:image" content="https://cdn.example/c.jpg?w=1&amp;h=2">', base), 'https://cdn.example/c.jpg?w=1&h=2')
  })

  test('no image, or a non-https one, gives null', () => {
    assert.equal(ogImage('<meta property="og:title" content="x">', base), null)
    assert.equal(ogImage('<meta property="og:image" content="http://cdn.example/a.jpg">', base), null)
  })
})

describe('withPreviews', () => {
  const page = (url: string, html: string) =>
    Object.defineProperty(new Response(html, { status: 200 }), 'url', { value: url })

  test('follows the google redirect, keeps the real url and the cover image', async () => {
    const fake = (async () => page('https://yemek.example/visneli', '<meta property="og:image" content="https://cdn.example/v.jpg">')) as typeof fetch
    const [s] = await withPreviews([{ title: 'yemek.example', url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/x' }], fake)
    assert.deepEqual(s, { title: 'yemek.example', url: 'https://yemek.example/visneli', image: 'https://cdn.example/v.jpg' })
  })

  test('never fetches a non-google address (ssrf), and survives a failing fetch', async () => {
    let calls = 0
    const boom = (async () => { calls += 1; throw new Error('down') }) as typeof fetch
    const local = { title: 'lan', url: 'http://192.168.1.1/admin' }
    const google = { title: 'g', url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/y' }
    assert.deepEqual(await withPreviews([local, google], boom), [local, google])
    assert.equal(calls, 1)
  })
})
