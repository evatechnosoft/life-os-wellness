import { api, ApiError } from './api'
import { lastDates, toLocalDate } from './date'
import { db, type ChatMessage } from './db'
import { hasServer } from './store'
import { applyDraft, draftLines, type NoteDraft } from './voice'

export interface ChatReply {
  text: string
  draft: NoteDraft | null
  sources: { title: string; url: string }[]
}

/**
 * The last week in a few lines, sent with every question so answers land on this
 * person's own numbers instead of generic advice. This is the "learns from you" part:
 * no training, just the real history as context.
 */
export async function buildContext(): Promise<string> {
  const dates = lastDates(7)
  const start = dates[0]!
  const end = dates[dates.length - 1]!
  const [logs, workouts, meals, wearable] = await Promise.all([
    db.daily_log.where('date').between(start, end, true, true).toArray(),
    db.workout.where('date').between(start, end, true, true).toArray(),
    db.meal.where('date').between(start, end, true, true).toArray(),
    db.wearable.where('date').between(start, end, true, true).toArray(),
  ])

  const lines: string[] = []
  for (const date of dates) {
    const log = logs.find((l) => l.date === date)
    const day: string[] = []
    if (log?.weight_kg != null) day.push(`${log.weight_kg} kg`)
    if (log?.protein_g != null) day.push(`${log.protein_g} g protein`)
    if (log?.steps != null) day.push(`${log.steps} adım`)
    const dayWorkouts = workouts.filter((w) => w.date === date)
    for (const w of dayWorkouts) {
      day.push(`${w.type}${w.sets_total ? ` ${w.sets_total} set` : ''}${w.duration_min ? ` ${w.duration_min} dk` : ''}`)
    }
    const dayMeals = meals.filter((m) => m.date === date && m.note)
    if (dayMeals.length > 0) day.push(`yedikleri: ${dayMeals.map((m) => m.note).join(', ')}`)
    for (const r of wearable.filter((w) => w.date === date && w.metric === 'snore_min')) {
      day.push(`horlama ~${Math.round(r.value)} dk`)
    }
    // Saatten gelen olcumler: Eva bunlari sormasin, bilsin.
    const hr = wearable.find((w) => w.date === date && w.metric === 'resting_hr')
    if (hr) day.push(`dinlenme nabzı ${Math.round(hr.value)}`)
    const kcal = wearable.find((w) => w.date === date && w.metric === 'total_kcal')
    if (kcal) day.push(`${Math.round(kcal.value)} kcal yakım`)
    if (day.length > 0) lines.push(`${date}: ${day.join(' · ')}`)
  }
  return lines.join('\n')
}

async function remember(entry: Omit<ChatMessage, 'id' | 'date' | 'at'>): Promise<ChatMessage> {
  const now = new Date()
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    date: toLocalDate(now),
    at: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    ...entry,
  }
  await db.chat.put(message)
  return message
}

/** Sends a turn and stores both sides. Returns the assistant's message. */
export async function ask(
  text: string,
  opts: { via?: 'text' | 'voice' | 'photo'; image?: Blob } = {},
): Promise<ChatMessage> {
  await remember({ role: 'user', text, via: opts.via ?? 'text' })

  if (!hasServer()) {
    return remember({
      role: 'eva',
      text: 'Sunucu bağlı değil, sorunu yanıtlayamıyorum. Söylediğini not olarak sakladım.',
      via: 'text',
    })
  }

  const history = (await db.chat.orderBy('id').reverse().limit(12).toArray())
    .reverse()
    .map((m) => ({ role: m.role === 'eva' ? ('assistant' as const) : ('user' as const), content: m.text }))

  const body: Record<string, unknown> = { messages: history, context: await buildContext() }
  if (opts.image) body.image = await toBase64(opts.image)

  try {
    const reply = await api<ChatReply>('/api/chat', { method: 'POST', body: JSON.stringify(body) })
    return remember({
      role: 'eva',
      text: reply.text,
      via: 'text',
      sources: reply.sources,
      draft: reply.draft ?? undefined,
    })
  } catch (err) {
    const message = err instanceof ApiError && err.status === 429
      ? 'Model şu an meşgul, birazdan tekrar sor.'
      : 'Yanıt alamadım. Bağlantıyı kontrol et.'
    return remember({ role: 'eva', text: message, via: 'text' })
  }
}

/** Writes a draft the user accepted and marks the message so it cannot be applied twice. */
export async function acceptDraft(message: ChatMessage): Promise<void> {
  if (!message.draft || message.applied) return
  const draft = message.draft as NoteDraft
  await applyDraft(draft, message.date)
  await db.chat.update(message.id, { applied: draftLines(draft) })
}

async function toBase64(blob: Blob): Promise<{ media_type: string; data: string }> {
  const buffer = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (const byte of buffer) binary += String.fromCharCode(byte)
  return { media_type: blob.type || 'image/jpeg', data: btoa(binary) }
}
