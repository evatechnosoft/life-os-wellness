import type { FastifyInstance } from 'fastify'

const NOTE_BODY = {
  type: 'object',
  additionalProperties: false,
  required: ['text'],
  properties: {
    text: { type: 'string', minLength: 1, maxLength: 2000 },
    date: { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' },
  },
} as const

const PROMPT = `Kullanıcı sağlık günlüğüne konuşarak not düşüyor. Cümlesinden kaydedilebilir verileri çıkar.

Yanıtı YALNIZCA şu JSON ile ver, başka metin ekleme:
{"weight_kg": <sayı|null>, "protein_g": <sayı|null>, "kcal": <sayı|null>, "steps": <sayı|null>,
 "bp_systolic": <sayı|null>, "bp_diastolic": <sayı|null>,
 "workout": {"type": "resistance"|"cardio"|"walk"|"rest", "duration_min": <sayı|null>, "sets_total": <sayı|null>, "muscle_groups": ["..."]}|null,
 "retro": {"went_well": "<...>"|null, "resistance": "<...>"|null, "experiment": "<...>"|null}|null,
 "meal_note": "<yenen şeyin kısa özeti>"|null,
 "summary": "<kullanıcıya gösterilecek tek cümle, Türkçe>"}

Kurallar:
- Cümlede geçmeyen alan null kalır. Uydurma.
- "yarım kilo verdim" gibi göreli ifadelerde weight_kg null bırak, summary'de belirt.
- Protein yalnız açıkça gram söylenmişse ya da yenen yemekten makul çıkarılabiliyorsa doldur.
- muscle_groups Türkçe: göğüs, sırt, bacak, omuz, kol, karın.
- summary her zaman dolu ve kısa olsun.`

interface AnthropicResponse {
  content?: { type: string; text?: string }[]
}

/** Extracts the JSON object from the model's reply and sanity-checks the shape. */
export function parseNote(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const value = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
    if (typeof value.summary !== 'string' || value.summary.length === 0) return null
    for (const key of ['weight_kg', 'protein_g', 'kcal', 'steps', 'bp_systolic', 'bp_diastolic']) {
      const v = value[key]
      if (v !== null && v !== undefined && typeof v !== 'number') return null
    }
    return value
  } catch {
    return null
  }
}

/**
 * Turns a spoken sentence into a draft entry. Speech-to-text happens on the phone;
 * this only reads the resulting text. Nothing is saved here - the app shows the draft
 * and the user confirms it.
 */
export function registerNote(app: FastifyInstance, apiKey: string | undefined): void {
  app.post('/api/note', { schema: { body: NOTE_BODY } }, async (req, reply) => {
    if (!apiKey) return reply.code(503).send({ error: 'ANTHROPIC_API_KEY tanimli degil' })
    const { text } = req.body as { text: string }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 512,
        system: PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      req.log.warn({ status: res.status, detail: detail.slice(0, 300) }, 'note upstream failed')
      return reply.code(502).send({ error: 'Not servisi yanit vermedi' })
    }

    const body = (await res.json()) as AnthropicResponse
    const parsed = parseNote(body.content?.find((p) => p.type === 'text')?.text ?? '')
    if (!parsed) return reply.code(502).send({ error: 'Not okunamadi' })
    return parsed
  })
}
