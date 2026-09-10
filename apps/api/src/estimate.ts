import type { FastifyInstance } from 'fastify'
import OpenAI from 'openai'

import { complete, type Llm } from './llm.ts'

const IMAGE_BODY = {
  type: 'object',
  additionalProperties: false,
  required: ['image'],
  properties: {
    image: {
      type: 'object',
      additionalProperties: false,
      required: ['media_type', 'data'],
      properties: {
        media_type: { type: 'string', enum: ['image/jpeg', 'image/png', 'image/webp'] },
        // ~5 MB of base64. The client downscales to 1024px before sending.
        data: { type: 'string', maxLength: 7_000_000 },
      },
    },
  },
} as const

const PROMPT = `Bu bir yemek fotoğrafı. Tabaktaki yiyecekleri tanı ve porsiyon büyüklüğünü tahmin et.

Yanıtı YALNIZCA şu JSON şemasıyla ver, başka hiçbir metin ekleme:
{"items": ["..."], "protein_g": <tam sayı>, "kcal": <tam sayı>, "confidence": "low"|"medium"|"high", "note": "<kısa açıklama, Türkçe>"}

Kurallar:
- Porsiyon ağırlığı fotoğraftan kesin bilinemez; belirsizsen confidence "low" ver.
- Tabakta yemek göremiyorsan protein_g ve kcal 0, confidence "low", note ile açıkla.
- Sayılar tahmindir, aralık verme, tek sayı ver.`

const ESTIMATE_SCHEMA = {
  type: 'object',
  required: ['items', 'protein_g', 'kcal', 'confidence'],
  properties: {
    items: { type: 'array', items: { type: 'string' } },
    protein_g: { type: 'number' },
    kcal: { type: 'number' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    note: { type: 'string' },
  },
} as const

/**
 * Reads a meal photo and returns an estimate. Off by default: without
 * ANTHROPIC_API_KEY the route answers 503 and the app falls back to manual entry.
 * The estimate is advice - the phone shows it for confirmation, never stores it silently.
 */
export function registerEstimate(app: FastifyInstance, llm: Llm | null): void {
  app.post('/api/estimate', { schema: { body: IMAGE_BODY } }, async (req, reply) => {
    if (!llm) return reply.code(503).send({ error: 'LLM_BASE_URL tanimli degil (LiteLLM proxy kapali)' })
    const { image } = req.body as { image: { media_type: string; data: string } }

    try {
      const { text } = await complete(
        llm,
        [{ role: 'user', content: PROMPT }],
        { model: llm.config.visionModel, image, maxTokens: 800 },
      )
      const parsed = parseEstimate(text)
      if (!parsed) {
        req.log.warn({ text: text.slice(0, 300) }, 'estimate not parseable')
        return reply.code(502).send({ error: 'Tahmin okunamadi' })
      }
      return parsed
    } catch (err) {
      if (err instanceof OpenAI.APIError) {
        req.log.warn({ status: err.status, message: err.message }, 'estimate upstream failed')
        return reply.code(502).send({ error: 'Tahmin servisi yanit vermedi' })
      }
      throw err
    }
  })
}

/** Pulls the JSON object out of the model's reply, tolerating stray prose or fences. */
export function parseEstimate(text: string): unknown | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const value = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
    if (typeof value.protein_g !== 'number' || typeof value.kcal !== 'number') return null
    if (!Array.isArray(value.items)) return null
    if (!['low', 'medium', 'high'].includes(String(value.confidence))) return null
    return value
  } catch {
    return null
  }
}

export { ESTIMATE_SCHEMA }
