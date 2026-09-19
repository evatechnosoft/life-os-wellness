import { api, ApiError } from './api'
import { coachTips, type CoachTip, type TodayTip } from './coach'
import { lastDates, toLocalDate } from './date'
import { db, type ChatMessage } from './db'
import { foodMemory, movingAverage, type FoodMemory } from './metrics'
import {
  mealSlot,
  proteinTarget,
  slotGaps,
  suggestFoods,
  weightTrend,
  type FoodSuggestion,
  type MealSlot,
  type ProteinTarget,
  type SlotGap,
  type WeightTrend,
} from './nutrition'
import { askLocal, LOCAL_NOTE, localModelReady } from './localLlm'
import { offlineReply } from './offline'
import { productLines } from './products'
import { EMPTY_PROFILE, profileLines, type Profile } from './profile'
import { DEFAULT_GOALS, type Goals } from './settings'
import { type Split } from './split'
import { hasServer } from './store'
import { applyDraft, draftLines, logNote, type NoteDraft } from './voice'
import { fillWorkout } from './workoutText'

export interface ChatReply {
  text: string
  draft: NoteDraft | null
  sources: { title: string; url: string }[]
}

/** Kural motorlarinin (coach + nutrition) hesapladigi her sey, tek pakette. */
export interface CoachContext {
  tips: CoachTip[]
  protein: ProteinTarget | null
  gaps: SlotGap[]
  foods: FoodSuggestion[]
  trend: WeightTrend | null
}

/**
 * Baglam her istekte gidiyor: dakikada bes istek kotasinda her satirin bedeli var.
 * O yuzden oneriler kirpilir - `warn` olanlar once, en fazla bu kadari.
 */
const MAX_TIPS = 4
const MAX_FOODS = 3
/** API semasindaki `context` siniri (apps/api/src/chat.ts); asilirsa istek 400 doner. */
const MAX_CONTEXT = 4000

const SLOT_TR: Record<MealSlot, string> = {
  morning: 'sabah',
  noon: 'öğle',
  evening: 'akşam',
  snack: 'ara öğün',
}

const TREND_TR = {
  on_track: 'hedefte',
  too_slow: 'hedefin altında',
  too_fast: 'hedeften hızlı',
} as const

function tipLine(tip: CoachTip): string | null {
  switch (tip.kind) {
    case 'volume_none':
      return `${tip.muscle}: bu hafta hiç set yok`
    case 'volume_low':
      return `${tip.muscle}: ${tip.sets}/${tip.target} set, ${tip.add} set eksik`
    case 'volume_high':
      return `${tip.muscle}: ${tip.sets} set, ${tip.cap} üstü azalan verim`
    case 'progress_weight':
      return `${tip.muscle}: ${tip.from_kg} kg → ${tip.to_kg} kg`
    case 'progress_reps':
      return `${tip.muscle}: ${tip.reps} → ${tip.to_reps} tekrar`
    case 'progress_sets':
      return `${tip.muscle}: haftalık ${tip.sets}/${tip.target} set`
    case 'stall':
      return `${tip.muscle}: ${tip.sessions} seanstır ilerleme yok`
    case 'deload':
      return `hafif hafta zamanı (${tip.weeks} hafta ${tip.reason === 'buildup' ? 'kesintisiz artış' : 'düşüş'})`
    // no_data ve today satiri: biri gurultu, digeri ayri basligi hak ediyor.
    default:
      return null
  }
}

function foodLine(f: FoodSuggestion): string {
  const portion = f.grams != null ? `${f.grams} g ` : f.count != null ? `${f.count} adet ` : ''
  const mark = f.source === 'seed' ? ' (geçmişte yok)' : ''
  return `${portion}${f.food} ~${f.protein_g} g protein${mark}`
}

/**
 * Yapilandirilmis oneriyi modele okunabilir birkac satira cevirir. Saf fonksiyon:
 * cumleyi burasi kurar, sayiyi kural motoru uretir - Eva ikisini de uydurmasin.
 * `coachText.ts` ayni veriyi ekran icin tam cumleye cevirir; burasi kasten kisa -
 * bu metin her istekte modele gidiyor, her karakterin kota bedeli var.
 */
export function coachLines(ctx: CoachContext): string[] {
  const lines: string[] = []

  const today = ctx.tips.find((t): t is TodayTip => t.kind === 'today')
  if (today) {
    const groups = today.groups.length > 0 ? today.groups.join(', ') : 'program yok'
    lines.push(`bugünün odağı: ${groups} (${today.logged ? 'kayıt girildi' : 'henüz kayıt yok'})`)
  }

  const picked = ctx.tips
    .filter((t) => t.kind !== 'today')
    // Array.sort kararli: esit onceliktekiler kural motorunun sirasini korur.
    .sort((a, b) => (a.severity === 'warn' ? 0 : 1) - (b.severity === 'warn' ? 0 : 1))
    .map(tipLine)
    .filter((l): l is string => l !== null)
    .slice(0, MAX_TIPS)
  if (picked.length > 0) lines.push(`antrenman önerileri (hesaplandı): ${picked.join(' · ')}`)

  if (ctx.protein) {
    const p = ctx.protein
    lines.push(`protein hedefi: ~${p.recommended_g} g/gün (aralık ${p.min_g}-${p.max_g}; ayardaki hedef ${p.current_goal_g} g)`)
  }

  if (ctx.gaps.length > 0) {
    const parts = ctx.gaps.map((g) => `${SLOT_TR[g.slot]} ${g.gap_g} g eksik${g.upcoming ? ' (henüz gelmedi)' : ''}`)
    lines.push(`bugün açık öğünler: ${parts.join(' · ')}`)
  }

  if (ctx.foods.length > 0) {
    const slot = SLOT_TR[ctx.foods[0]!.slot]
    lines.push(`${slot} için önerilebilecek yiyecekler: ${ctx.foods.slice(0, MAX_FOODS).map(foodLine).join(' · ')}`)
  }

  if (ctx.trend) {
    const t = ctx.trend
    lines.push(`kilo trendi: haftada ${t.actual_kg} kg (hedef ${t.target_kg} kg) — ${TREND_TR[t.status]}`)
  }

  return lines
}

/**
 * The last week in a few lines, sent with every question so answers land on this
 * person's own numbers instead of generic advice. This is the "learns from you" part:
 * no training, just the real history as context.
 */
export async function buildContext(now: Date = new Date()): Promise<string> {
  return (await gather(now)).text
}

/** Baglam bir kez toplanir: modele metin olarak, offline Eva'ya yapilandirilmis olarak gider. */
async function gather(now: Date): Promise<{ text: string; ctx: CoachContext; known: FoodMemory[] }> {
  const dates = lastDates(7, now)
  const start = dates[0]!
  const end = dates[dates.length - 1]!
  // Kilo trendi iki 7-gun ortalamasini karsilastirir, deload bes haftalik tonaj ister:
  // pencereler genis cekilir, gunluk satirlar bellekte daraltilir.
  const dates14 = lastDates(14, now)
  const start35 = lastDates(35, now)[0]!
  const [logs14, workouts35, meals, wearable, splitRow, goalsRow, profileRow, recentMeals] = await Promise.all([
    db.daily_log.where('date').between(dates14[0]!, end, true, true).toArray(),
    db.workout.where('date').between(start35, end, true, true).toArray(),
    db.meal.where('date').between(start, end, true, true).toArray(),
    db.wearable.where('date').between(start, end, true, true).toArray(),
    db.settings.get('split'),
    db.settings.get('goals'),
    db.settings.get('profile'),
    // Hafiza yedi gunden uzun: "tavuk kac gram" sorusu son iki haftaya sigmaz.
    db.meal.reverse().limit(60).toArray(),
  ])
  const logs = logs14.filter((l) => l.date >= start)
  const workouts = workouts35.filter((w) => w.date >= start)

  const lines: string[] = []
  const profile: Profile = { ...EMPTY_PROFILE, ...((profileRow?.value as Partial<Profile> | undefined) ?? {}) }

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
    const spo2 = wearable.find((w) => w.date === date && w.metric === 'spo2_pct')
    const spo2Low = wearable.find((w) => w.date === date && w.metric === 'spo2_low_pct')
    if (spo2) day.push(`kan oksijeni %${Math.round(spo2.value)}${spo2Low ? ` (en düşük %${Math.round(spo2Low.value)})` : ''}`)
    const hrv = wearable.find((w) => w.date === date && w.metric === 'hrv_ms')
    if (hrv) day.push(`HRV ${Math.round(hrv.value)} ms`)
    const sleep = wearable.find((w) => w.date === date && w.metric === 'sleep_min')
    if (sleep) day.push(`uyku ${Math.floor(sleep.value / 60)} sa ${Math.round(sleep.value % 60)} dk`)
    if (day.length > 0) lines.push(`${date}: ${day.join(' · ')}`)
  }
  // Ambalajli urunler: etiketten okunmus sabit degerler, kullanicinin gecmisinden
  // bagimsiz. "Helva yedim" duyulunca Eva 600 kcal'i buradan alir, uydurmaz.
  lines.push(...productLines())
  // Sik yediklerinin gecmisteki degerleri: Eva "tavuk yedim" duyunca porsiyonu sormasin.
  const known = foodMemory(recentMeals)
  if (known.length > 0) {
    const parts = known.map((f) => `${f.name} ~${f.protein_g} g protein${f.kcal != null ? ` / ${Math.round(f.kcal)} kcal` : ''}`)
    lines.push(`sık yedikleri (kendi geçmiş kayıtlarından): ${parts.join(' · ')}`)
  }

  // Koc katmani: ekranda gosterilen onerilerin aynisi. Eva ayni sayilari konussun.
  const split = (splitRow?.value as Split | undefined) ?? {}
  const goals: Goals = { ...DEFAULT_GOALS, ...((goalsRow?.value as Partial<Goals> | undefined) ?? {}) }
  const weightsOf = (window: string[]): number | null =>
    movingAverage(window.map((d) => logs14.find((l) => l.date === d)?.weight_kg))
  const avgWeight = weightsOf(dates)
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const gaps = slotGaps(meals.filter((m) => m.date === end), avgWeight, goals, time)
  const slot = gaps[0]?.slot ?? mealSlot(time)
  const ctx: CoachContext = {
    tips: coachTips(workouts35, goals, split, end),
    protein: proteinTarget(avgWeight, goals),
    gaps,
    foods: suggestFoods(recentMeals, slot, { recentMeals: meals, limit: MAX_FOODS }),
    trend: weightTrend(weightsOf(dates14.slice(0, 7)), weightsOf(dates14.slice(7)), goals),
  }
  lines.push(...coachLines(ctx))
  // Profil satirlari listenin basina: model once kiminle konustugunu bilsin. Yine de
  // burada ekleniyorlar, cunku protein araligi 7 gun kilo ortalamasina dayaniyor.
  lines.unshift(...profileLines(profile, avgWeight, now))
  return { text: lines.join('\n').slice(0, MAX_CONTEXT), ctx, known }
}

/**
 * Iki ayri 429 var ve kullanicinin yapmasi gereken sey farkli: `too_many_requests`
 * bizim kendi hiz limitimiz (yavasla), digeri saglayicinin dakikalik kotasi (bekle).
 * Ham saglayici metni kullaniciya gosterilmez.
 */
export function chatErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status === 429) {
    return err.message === 'too_many_requests'
      ? 'Çok hızlı gidiyor: arka arkaya çok istek attık, bir dakika bekle.'
      : 'Eva şu an yoğun, birkaç saniye sonra tekrar dene.'
  }
  return 'Yanıt alamadım. Bağlantıyı kontrol et.'
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

  const { text: context, ctx, known } = await gather(new Date())
  const history = (await db.chat.orderBy('id').reverse().limit(12).toArray())
    .reverse()
    .map((m) => ({ role: m.role === 'eva' ? ('assistant' as const) : ('user' as const), content: m.text }))

  // Sunucu yoksa ya da dustuyse Eva susmaz: persona ve veri telefonda. Model indirildiyse
  // (APK) o konusur; yoksa ya da tikanirsa kural motoru. Fotograf yalniz sunucuyla.
  const offline = async (): Promise<ChatMessage> => {
    // Fotograf sunucusuz okunamaz (cihaz-ici model gorme yetenegi tasimiyor). Bunu
    // soylemeden metin cevabi vermek, tabaga bakilmis gibi gorunurdu.
    if (opts.image) {
      return remember({ role: 'eva', text: 'Fotoğrafı ancak sunucu açıkken okuyabilirim. Ne yediğini yazarsan kaydederim.', via: 'text' })
    }
    if (await localModelReady()) {
      try {
        const r = await askLocal(context, history)
        return remember({ role: 'eva', text: `${LOCAL_NOTE} ${r.text}`, via: 'text', draft: fillWorkout(r.draft, text) ?? undefined })
      } catch {
        // Model yuklenemedi / bellek yetmedi: kural tabanli cevap yine de verilir.
      }
    }
    const r = offlineReply(text, ctx, known)
    return remember({ role: 'eva', text: r.text, via: 'text', draft: r.draft ?? undefined })
  }
  if (!hasServer()) return offline()

  const body: Record<string, unknown> = { messages: history, context }
  if (opts.image) body.image = await toBase64(opts.image)

  try {
    // Ulasilamayan LAN adresi TCP zaman asimina kadar asar; offline cevap o kadar beklemesin.
    const reply = await api<ChatReply>('/api/chat', { method: 'POST', body: JSON.stringify(body), signal: AbortSignal.timeout(25_000) })
    return remember({
      role: 'eva',
      text: reply.text,
      via: 'text',
      sources: reply.sources,
      // Bolge bos geldiyse cumleden tamamlanir - ikinci bir model turu kotaya mal olurdu.
      draft: fillWorkout(reply.draft, text) ?? undefined,
    })
  } catch (err) {
    // 429 sunucunun ayakta oldugunu soyler: kullanici beklesin, offline cevaba dusme.
    if (err instanceof ApiError && err.status === 429) return remember({ role: 'eva', text: chatErrorMessage(err), via: 'text' })
    return offline()
  }
}

/** Writes a draft the user accepted and marks the message so it cannot be applied twice. */
export async function acceptDraft(message: ChatMessage): Promise<void> {
  if (!message.draft || message.applied) return
  const draft = message.draft as NoteDraft
  const applied = draftLines(draft)
  await applyDraft(draft, message.date)
  await db.chat.update(message.id, { applied })
  // Tek kayit defteri: Ayar -> Notlar hangi ekrandan kaydedildigine bakmaz.
  const asked = (await db.chat.orderBy('id').toArray()).filter((m) => m.role === 'user').at(-1)
  await logNote({ via: 'text', text: asked?.text ?? '', summary: draft.summary, applied }, message.date)
}

async function toBase64(blob: Blob): Promise<{ media_type: string; data: string }> {
  const buffer = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (const byte of buffer) binary += String.fromCharCode(byte)
  return { media_type: blob.type || 'image/jpeg', data: btoa(binary) }
}
