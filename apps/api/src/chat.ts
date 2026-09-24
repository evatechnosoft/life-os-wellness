import type { FastifyInstance } from 'fastify'
import OpenAI from 'openai'

import { complete, type ChatTurn, type Llm, type Source } from './llm.ts'
import { withPreviews } from './preview.ts'
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
  sources: Source[]
}

/**
 * "Elimde yogurt, visne var, ne yapabilirim?" - malzemeden tarif arastirmasi. Bu durumda
 * fotograf olsa bile web aranir (tezgah fotografi = malzeme listesi) ve kaynaklarin kapak
 * resmi getirilir. Diger sorularda arama/resim maliyeti odenmez.
 */
export function wantsRecipes(text: string): boolean {
  return /tarif|nes*yap|yapabilir|elimde|elimdeki|malzeme/i.test(text)
}

export const RECIPE_HINT = `Kullanici elindeki malzemelerle ne yapabilecegini soruyor.
- Fotograf varsa once gorulen malzemeleri tek satirda say.
- Internetten 2-3 gercek tarif bul; her biri: ad, malzeme (gram), 3-5 adim, porsiyon basina yaklasik kcal ve protein.
- Kendi kurallarina uydur: sekersiz (bal/pekmez yok, gerekirse stevia/eritritol), porsiyonda en fazla 1 meyve, protein ekle (suzme yogurt, lor, yumurta, et).
- Tarifi hangi siteden aldigini adiyla yaz; kaynak uydurma.`

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
    const recipes = wantsRecipes(messages[messages.length - 1]?.content ?? '')
    if (recipes) turns.splice(1, 0, { role: 'system', content: RECIPE_HINT })

    try {
      const ask = () => complete(llm, turns, {
        model: image ? llm.config.visionModel : llm.config.chatModel,
        image,
        maxTokens: 1500,
        // A photo is read, not researched - unless it is a pantry shot asking for recipes.
        search: !image || recipes,
      })
      let { text: raw, sources } = await ask()
      // Gemini bazen arar ama sayfaya dayanmadan yazar (kaynak 0, 24 Eyl canli: 2 denemede 1).
      // Tarifte kaynaksiz cevap uydurma riskidir; bir kez daha sorulur.
      // ponytail: tek yeniden deneme, ~10-20 sn ek bekleme; sik olursa modeli degistir.
      if (recipes && sources.length === 0) ({ text: raw, sources } = await ask())
      const { text, draft } = splitReply(raw)
      const body: ChatReply = { text, draft, sources: recipes ? await withPreviews(sources) : sources }
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
