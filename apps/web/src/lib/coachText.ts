import type { CoachTip, TodayTip } from './coach'
import type { DietBreak } from './dietBreak'
import type { RecoveryPlan } from './lapse'
import type { FoodSuggestion, MealSlot, Severity, SlotGap } from './nutrition'

/**
 * Kural motorlarinin yapilandirilmis ciktisini Turkce cumleye cevirir. Saf
 * fonksiyon: veri okumaz, saat sormaz. Ton notru - oneri bir teklif, borc degil;
 * suclayici ya da uyarici dil kullanilmaz.
 */

const num = (n: number): string => n.toLocaleString('tr-TR')

/** Yalin ve yonelme hali ayri tutulur: "ogle icin" ve "oglene" ikisi de gerekiyor. */
const SLOT_LABEL: Record<MealSlot, { nom: string; dat: string }> = {
  morning: { nom: 'sabah', dat: 'sabaha' },
  noon: { nom: 'öğle', dat: 'öğlene' },
  evening: { nom: 'akşam', dat: 'akşama' },
  snack: { nom: 'ara öğün', dat: 'ara öğüne' },
}

/** "200 g tavuk göğsü (62 g protein)" - porsiyon gecmisten biliniyorsa yazilir. */
export function foodText(food: FoodSuggestion): string {
  const portion =
    food.grams != null ? `${num(food.grams)} g ` : food.count != null ? `${num(food.count)} ` : ''
  return `${portion}${food.food} (${num(food.protein_g)} g protein)`
}

/** Acik kalan slot + o slota uyan somut yiyecek. Gelmemis slot plandir, kacirilmis ogun degil. */
export function gapText(gap: SlotGap, foods: FoodSuggestion[] = []): string {
  const label = SLOT_LABEL[gap.slot]
  const head = gap.upcoming
    ? `${label.dat} ${num(gap.gap_g)} g protein planla`
    : `${label.nom} için ${num(gap.gap_g)} g protein açık`
  const picks = foods.slice(0, 2).map(foodText).join(' ya da ')
  return picks === '' ? `${head}.` : `${head}: ${picks}.`
}

/** Bugunun bolgesi - oneri olmasa da kartin ust satirinda hep durur. */
export function todayText(tip: TodayTip): string {
  const head = tip.groups.length > 0 ? `Bugün ${tip.groups.join(', ')}` : 'Bugün programda bölge yok'
  return tip.logged ? `${head} · kayıt girildi` : head
}

export function tipText(tip: CoachTip): string {
  switch (tip.kind) {
    case 'volume_low':
      return `${tip.muscle}: bu hafta ${num(tip.sets)} set, hedef ${num(tip.target)} — ${num(tip.add)} set daha ekleyebilirsin.`
    case 'volume_high':
      return `${tip.muscle}: bu hafta ${num(tip.sets)} set; ${num(tip.cap)} üstünde kazanç azalan verimle sürüyor — toparlanmanı izle.`
    case 'volume_none':
      return `${tip.muscle} bu hafta programda var ama henüz kaydı yok.`
    case 'progress_weight':
      return `${tip.muscle}: ${num(tip.from_kg)} kg ile set başına 12 tekrarı geçtin — ${num(tip.to_kg)} kg deneyebilirsin.`
    case 'progress_reps':
      return `${tip.muscle}: aynı ağırlıkta set başına ${num(tip.reps)} tekrar yaptın — ${num(tip.to_reps)} tekrarı hedefleyebilirsin.`
    case 'progress_sets':
      return `${tip.muscle}: bu hafta ${num(tip.sets)} set, hedef ${num(tip.target)} — set eklemek en kolay artış.`
    case 'stall':
      return `${tip.muscle} ${num(tip.sessions)} seanstır aynı yerde — egzersiz değiştirmek ya da tekrar aralığını açmak işe yarayabilir.`
    case 'no_data':
      return `${tip.muscle} için ağırlık ve tekrar kaydı yok — girmeye başlarsan ilerlemeyi ben takip ederim.`
    case 'deload':
      return tip.reason === 'buildup'
        ? `${num(tip.weeks)} haftadır hacim kesintisiz artıyor — toparlanman zorlanıyorsa hafif bir hafta iyi gelebilir.`
        : `${num(tip.weeks)} haftadır hacim düşüyor — hafif bir hafta sonrası genelde daha iyi başlıyor.`
    case 'today':
      return todayText(tip)
  }
}

export interface CoachLine {
  id: string
  text: string
  severity: Severity
}

/**
 * Tek siralanmis oneri listesi. Beslenme acigi one gecer (en somut is), ardindan
 * antrenman; her iki grupta da `warn` once. `today` burada yer almaz - kart onu
 * ayrica gosterir. Ayni "veri yok" cumlesi her kas grubu icin tekrarlanmaz.
 */
export function coachLines(
  tips: CoachTip[],
  gaps: { gap: SlotGap; foods: FoodSuggestion[] }[],
): CoachLine[] {
  let noDataShown = false
  const fromTips: CoachLine[] = []
  for (const tip of tips) {
    if (tip.kind === 'today') continue
    if (tip.kind === 'no_data') {
      if (noDataShown) continue
      noDataShown = true
    }
    const id = 'muscle' in tip ? `${tip.kind}:${tip.muscle}` : tip.kind
    fromTips.push({ id, text: tipText(tip), severity: tip.severity })
  }

  const fromGaps: CoachLine[] = gaps.map(({ gap, foods }) => ({
    id: `slot:${gap.slot}`,
    text: gapText(gap, foods),
    severity: gap.severity,
  }))

  const rank = (line: CoachLine): number => (line.severity === 'warn' ? 0 : 1)
  return [...fromGaps, ...fromTips].sort((a, b) => rank(a) - rank(b))
}

const WEEK_STATUS: Record<RecoveryPlan['week_status'], string> = {
  on_track: 'Hafta hâlâ yolunda',
  slight: 'Hafta biraz kaydı ama duruyor',
  reset: 'Bu hafta üst üste geldi',
}

/**
 * Telafi plani cumlesi. Tek kural: KISITLAMA DILI YOK. Burada "az ye", "atla",
 * "telafi et" gecmez; ne EKLENECEGI yazilir (COACH-PERSONA §2.2).
 */
export function recoveryText(plan: RecoveryPlan): string {
  const when = plan.applies_to === 'today' ? 'Günün kalan öğününde' : 'Yarın'
  const parts = [`${num(plan.protein_g)} g proteini tamamla`, `${num(plan.fiber_servings)} porsiyon sebze`]
  if (plan.steps_add > 0) parts.push(`+${num(plan.steps_add)} adım`)
  const tail = plan.refer_support
    ? ' Son bir aydır bu sık tekrarlıyor; istersen bir uzmanla konuşmak iyi gelebilir.'
    : ''
  return `${WEEK_STATUS[plan.week_status]}. ${when} ${parts.join(', ')}. Öğün atlama; yarınki tartı su tutar, ona bakma.${tail}`
}

/** Diyet molasi cumlesi. "Metabolizmani sifirlar" demez: kanit sinirli, arac. */
export function dietBreakText(b: DietBreak): string {
  const waist = b.waist_known ? ' ve bel de düşmüyor' : ''
  return `${num(b.weeks_in_deficit)} haftadır açıktasın, son üç hafta kilo neredeyse durdu${waist}. ${num(b.days)} gün bakımda kalmak (protein aynı, antrenman aynı, kayıp hedefi 0) sonrasını kolaylaştırabilir — mucize değil, bir araç.`
}
