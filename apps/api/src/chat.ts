import type { FastifyInstance } from 'fastify'
import OpenAI from 'openai'

import { complete, type ChatTurn, type Llm } from './llm.ts'

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

const SYSTEM = `Sen Eva'sın: Dean'in sağlık günlüğünde çalışan, ölçülü ve sıcak bir yardımcı.

Nasıl konuşursun:
- Kısa, insan gibi, gereksiz nezaket kalıbı yok. Emoji yok, madde işareti şart değil.
- Bildiğini bilirsin, bilmediğini söylersin. Tıbbi tanı koymazsın; işaret görürsen hekime yönlendirirsin.
- Kullanıcının kendi geçmişi elindeyse ona dayan ("son 7 günde ortalaman ..."), genel tavsiye ikinci sırada.
- Bir besinin değerini bilmiyorsan tahmin ettiğini söyle; uydurma kesinlik verme.

Her yanıtta, kaydedilebilir bir veri geçtiyse yanıtın SONUNA tek satır JSON ekle:
<kayit>{"weight_kg":null,"protein_g":null,"kcal":null,"steps":null,"bp_systolic":null,"bp_diastolic":null,"workout":null,"meal_note":null,"summary":"..."}</kayit>
Kaydedilecek bir şey yoksa <kayit> satırını hiç yazma. Uydurma; yalnız kullanıcının söylediğini ya da fotoğraftan makul çıkanı doldur.
workout alanı: {"type":"resistance"|"cardio"|"walk"|"rest","duration_min":sayı|null,"sets_total":sayı|null,"muscle_groups":["göğüs","sırt","bacak","omuz","kol","karın" içinden]}`

export interface ChatReply {
  text: string
  draft: Record<string, unknown> | null
  sources: { title: string; url: string }[]
}

/** Splits the visible answer from the trailing <kayit> block the system prompt asks for. */
export function splitReply(raw: string): { text: string; draft: Record<string, unknown> | null } {
  const open = raw.indexOf('<kayit>')
  if (open === -1) return { text: raw.trim(), draft: null }
  const close = raw.indexOf('</kayit>', open)
  const json = raw.slice(open + 7, close === -1 ? undefined : close)
  const text = (raw.slice(0, open) + (close === -1 ? '' : raw.slice(close + 8))).trim()
  try {
    const draft = JSON.parse(json.trim()) as Record<string, unknown>
    if (typeof draft.summary !== 'string') return { text, draft: null }
    for (const key of ['weight_kg', 'protein_g', 'kcal', 'steps', 'bp_systolic', 'bp_diastolic']) {
      const v = draft[key]
      if (v !== null && v !== undefined && typeof v !== 'number') return { text, draft: null }
    }
    return { text, draft }
  } catch {
    return { text, draft: null }
  }
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
      const raw = await complete(llm, turns, {
        model: image ? llm.config.visionModel : llm.config.chatModel,
        image,
        maxTokens: 1500,
      })
      const { text, draft } = splitReply(raw)
      // Sources stay empty until the proxy's RAG/search layer starts returning them.
      const body: ChatReply = { text, draft, sources: [] }
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
