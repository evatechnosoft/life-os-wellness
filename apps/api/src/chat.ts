import type { FastifyInstance } from 'fastify'
import OpenAI from 'openai'

import { complete, type ChatTurn, type Llm } from './llm.ts'
import { SYSTEM, splitReply } from './persona.ts'

export { SYSTEM, splitReply }

const DATE = { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' } as const

const CHAT_BODY = {
  type: 'object',
  additionalProperties: false,
  required: ['messages'],
  properties: {
    messages: {
      type: 'array',
      minItems: 1,
      maxItems: 40,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['role', 'content'],
        properties: {
          role: { type: 'string', enum: ['user', 'assistant'] },
          content: { type: 'string', minLength: 1, maxLength: 4000 },
        },
      },
    },
    date: DATE,
    /** Recent days, so answers land on this person's numbers rather than generic advice. */
    context: { type: 'string', maxLength: 4000 },
    /** Base64 photo attached to the last user message (a plate, a label, a scale). */
    image: {
      type: 'object',
      additionalProperties: false,
      required: ['media_type', 'data'],
      properties: {
        media_type: { type: 'string', enum: ['image/jpeg', 'image/png', 'image/webp'] },
        data: { type: 'string', maxLength: 7_000_000 },
      },
    },
  },
} as const

export interface ChatReply {
  text: string
  draft: Record<string, unknown> | null
  sources: { title: string; url: string }[]
}

/**
 * One endpoint for everything the assistant does: answering, reading a photo, searching
 * the web for a food value, and proposing an entry. Nothing is written here - the phone
 * shows the draft and the user confirms it.
 */
export function registerChat(app: FastifyInstance, llm: Llm | null): void {
  app.post('/api/chat', { schema: { body: CHAT_BODY } }, async (req, reply) => {
    if (!llm) return reply.code(503).send({ error: 'LLM_BASE_URL tanimli degil (LiteLLM proxy kapali)' })
    const { messages, context, image } = req.body as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      context?: string
      image?: { media_type: string; data: string }
    }

    const turns: ChatTurn[] = [{ role: 'system', content: SYSTEM }]
    if (context) turns.push({ role: 'system', content: `Kullanıcının son günleri:
${context}` })
    turns.push(...messages)

    try {
      const { text: raw, sources } = await complete(llm, turns, {
        model: image ? llm.config.visionModel : llm.config.chatModel,
        image,
        maxTokens: 1500,
        // A photo is read, not researched; search only costs a round trip there.
        search: !image,
      })
      const { text, draft } = splitReply(raw)
      const body: ChatReply = { text, draft, sources }
      return body
    } catch (err) {
      if (err instanceof OpenAI.RateLimitError) {
        return reply.code(429).send({ error: 'Model şu an meşgul, birazdan tekrar dene' })
      }
      if (err instanceof OpenAI.APIError) {
        req.log.warn({ status: err.status, message: err.message }, 'chat upstream failed')
        return reply.code(502).send({ error: 'Yanıt alınamadı' })
      }
      throw err
    }
  })
}
