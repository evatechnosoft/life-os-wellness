import type { CoachContext } from './chat'
import type { TodayTip } from './coach'
import { gapText, tipText, todayText } from './coachText'
import type { FoodMemory } from './metrics'
import { foldTr } from './nutrition'
import type { NoteDraft } from './voice'
import { classifyExercise } from './workoutText'

/**
 * Sunucu yokken Eva. LLM cagirmaz: persona sabit, veri telefonda, cumleyi kural
 * motorunun ciktisindan kurar. Sunucu donunce `ask()` yine modele gider; burasi
 * "yanit alamadim" yerine gecen taban katman, modelin yerine gecen bir sey degil.
 *
 * Iki is: (1) cumledeki sayilari <kayit> taslagina cevirmek, (2) soruyu hesaplanmis
 * oneriyle yanitlamak. Hesaplanmis oneride gecmeyen rakam yazilmaz (persona kilidi).
 */

export interface OfflineReply {
  text: string
  draft: NoteDraft | null
}

export const OFFLINE_NOTE = 'Sunucu kapalı, kendi kayıtlarından yanıtlıyorum.'

/** Persona 2.2 acil listesi: burada plan verilmez, hekime yonlendirilir. */
const RED_FLAGS = ['gogus agri', 'gogsumde', 'nefes darl', 'bayil', 'carpinti', 'bas don', 'kola yay', 'ceneye']

const num = (n: number): string => n.toLocaleString('tr-TR')

function grab(folded: string, unit: RegExp): number | null {
  const m = folded.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:${unit.source})(?![a-z])`))
  return m ? Number(m[1]!.replace(',', '.')) : null
}

/** Sayilari taslaga cevirir; soylenmeyen alan null kalir, tahmin yok. */
export function parseDraft(text: string, known: FoodMemory[] = []): NoteDraft | null {
  const folded = ` ${foldTr(text)} `
  const draft: NoteDraft = { summary: '' }
  const parts: string[] = []

  const bp = folded.match(/(\d{2,3})\s*[/\\]\s*(\d{2,3})/)
  if (bp) {
    draft.bp_systolic = Number(bp[1])
    draft.bp_diastolic = Number(bp[2])
    parts.push(`tansiyon ${bp[1]}/${bp[2]}`)
  }

  const protein = grab(folded, /g(?:r|ram)?\s*protein|protein/)
  if (protein != null) {
    draft.protein_g = protein
    parts.push(`${num(protein)} g protein`)
  }

  const steps = grab(folded, /adim/)
  if (steps != null) {
    draft.steps = steps
    parts.push(`${num(steps)} adım`)
  }

  const exercise = classifyExercise(text)
  const sets = grab(folded, /set/)
  const reps = grab(folded, /tekrar/)
  const byX = folded.match(/(\d+)\s*x\s*(\d+)/)
  const minutes = grab(folded, /dk|dakika/)
  const lifted = grab(folded, /kg|kilo/)
  // Sayisiz antrenman cumlesi ("squat kac kilo?") kayit degil sorudur; yalin "84 kg"
  // ise tartidir - classifyExercise 'kg' gorunce resistance der, ona guvenilmez.
  const measured = sets != null || reps != null || byX !== null || minutes != null || lifted != null
  const strength = sets != null || reps != null || byX !== null || exercise.muscle_groups.length > 0 || /kaldir|antrenman|agirlik/.test(folded)
  const isWorkout = measured && (strength || (exercise.type !== null && exercise.type !== 'resistance'))

  if (isWorkout) {
    const setsTotal = sets ?? (byX ? Number(byX[1]) : null)
    const perSet = reps ?? (byX ? Number(byX[2]) : null)
    draft.workout = {
      type: exercise.type ?? 'resistance',
      duration_min: minutes,
      sets_total: setsTotal,
      reps_total: setsTotal != null && perSet != null ? setsTotal * perSet : perSet,
      // Kaldirilan agirlik vucut kilosu degil: "60 kg bench" ustteki alana yazilmaz.
      weight_kg: exercise.type === 'walk' || exercise.type === 'cardio' ? null : lifted,
      muscle_groups: exercise.muscle_groups,
    }
    parts.push('antrenman')
  } else if (lifted != null && lifted >= 30 && lifted <= 250) {
    draft.weight_kg = lifted
    parts.push(`${num(lifted)} kg`)
  }

  const ate = /\b(yedim|ictim|yiyorum|iciyorum)\b/.test(folded)
  if (ate) {
    draft.meal_note = text.trim()
    const hit = known.find((f) => folded.includes(` ${foldTr(f.name)}`))
    if (hit && draft.protein_g == null) {
      draft.protein_g = hit.protein_g
      if (hit.kcal != null) draft.kcal = hit.kcal
      parts.push(`${hit.name} ~${num(hit.protein_g)} g protein`)
    } else if (draft.protein_g == null) {
      parts.push('öğün notu')
    }
  }

  if (parts.length === 0) return null
  draft.summary = parts.join(', ')
  return draft
}

function answer(folded: string, ctx: CoachContext): string {
  const tips = ctx.tips.filter((t): t is Exclude<typeof t, TodayTip> => t.kind !== 'today')
  const today = ctx.tips.find((t): t is TodayTip => t.kind === 'today')

  if (/protein|ne yiyeyim|yemek|ogun|ac(im|ligim)\b/.test(folded)) {
    const lines: string[] = []
    if (ctx.protein) lines.push(`Protein hedefin 7 günlük ortalama kilondan ~${num(ctx.protein.recommended_g)} g/gün (${num(ctx.protein.min_g)}-${num(ctx.protein.max_g)}).`)
    for (const gap of ctx.gaps.slice(0, 2)) lines.push(gapText(gap, ctx.foods.filter((f) => f.slot === gap.slot)))
    if (lines.length === 0) lines.push('Elimde hesaplanmış bir beslenme önerisi yok — kilo ve öğün kaydı girilince çıkarırım.')
    return lines.join(' ')
  }

  if (/antrenman|set|program|bugun ne|kaldir|agirlik|squat|bench|hacim/.test(folded)) {
    const lines: string[] = []
    if (today) lines.push(`${todayText(today)}.`)
    const picked = tips.filter((t) => t.kind !== 'no_data').slice(0, 3)
    for (const t of picked) lines.push(tipText(t))
    if (picked.length === 0) lines.push('Elimde hesaplanmış bir antrenman önerisi yok — ağırlık ve tekrar girilince ilerlemeyi çıkarırım.')
    return lines.join(' ')
  }

  if (/kilo|tarti|trend|zayifl|verdim|aldim/.test(folded)) {
    if (!ctx.trend) return 'Kilo trendi için iki haftalık tartı kaydı gerekiyor; henüz o kadar yok.'
    const t = ctx.trend
    const status = t.status === 'on_track' ? 'hedefte' : t.status === 'too_slow' ? 'hedefin altında' : 'hedeften hızlı — bu hızda kas kaybı riski var'
    return `7 günlük ortalamalara göre haftada ${num(t.actual_kg)} kg değişim, hedef ${num(t.target_kg)} kg: ${status}. Tek günlük kiloya bakmıyorum.`
  }

  // Serbest soru: modelsiz yorum yok, elde ne varsa o. Veri yoksa bunu soyle.
  const lines: string[] = []
  if (today) lines.push(`${todayText(today)}.`)
  const warn = [...ctx.gaps.map((g) => gapText(g, ctx.foods.filter((f) => f.slot === g.slot))), ...tips.filter((t) => t.severity === 'warn').map(tipText)]
  lines.push(...warn.slice(0, 2))
  if (lines.length === 0) lines.push('Bu soruya sunucu dönünce yanıt verebilirim; şimdilik yalnız kayıt alabilirim.')
  return lines.join(' ')
}

export function offlineReply(text: string, ctx: CoachContext, known: FoodMemory[] = []): OfflineReply {
  const folded = ` ${foldTr(text)} `
  if (RED_FLAGS.some((f) => folded.includes(f))) {
    return {
      text: `${OFFLINE_NOTE} Bunu ben değerlendiremem: yazdığın belirti bugün bir hekime görünmeyi gerektirir. Antrenman önerilerini o netleşene kadar bekletiyorum.`,
      draft: null,
    }
  }
  const draft = parseDraft(text, known)
  const body = draft
    ? `Not aldım: ${draft.summary}. Onaylarsan günlüğe yazarım.`
    : answer(folded, ctx)
  return { text: `${OFFLINE_NOTE} ${body}`, draft }
}
