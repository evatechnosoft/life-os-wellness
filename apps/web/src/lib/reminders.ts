import { useLiveQuery } from 'dexie-react-hooks'

import { toLocalDate } from './date'
import { db, type DailyLog, type Retro } from './db'
import { isNative } from './health'

export interface ReminderSettings {
  enabled: boolean
  /** HH:MM, local. */
  weigh_at: string
  retro_at: string
  /** Bel olcusu haftada bir sorulur; 0 = pazar, JavaScript getDay() ile ayni. */
  waist_day: number
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: true,
  weigh_at: '09:00',
  retro_at: '21:00',
  waist_day: 1,
}

export interface Reminder {
  id: 'weigh' | 'retro' | 'waist' | 'dinner'
  title: string
  body: string
}

const TEXT: Record<Reminder['id'], Omit<Reminder, 'id'>> = {
  weigh: { title: 'Sabah tartısı', body: 'Aç karnına tartıldın mı? Kiloyu gir.' },
  retro: { title: 'Akşam retrosu', body: 'Bugün ne iyi gitti, nerede zorlandın?' },
  waist: { title: 'Bel ölçüsü', body: 'Haftalık ölçüm: göbek deliği hizasından, nefes verirken.' },
  dinner: { title: 'Akşam yemeği', body: 'Akşam öğünü kayıtlı değil. Ne yediğini yaz, gün boş kalmasın.' },
}

/** Bu saatten sonraki ogun aksam yemegi sayilir. */
const DINNER_FROM = '17:00'

/** Bugunun ogun saatlerinde aksam ogunu var mi. */
export function hasDinner(mealTimes: string[]): boolean {
  return mealTimes.some((t) => minutesOf(t) >= minutesOf(DINNER_FROM))
}

/** "9:05" -> 545. Metin karsilastirmasi "9:05" > "21:00" derdi, dakikaya cevirmek sart. */
export function minutesOf(time: string): number {
  const [h, m] = time.split(':')
  return Number(h) * 60 + Number(m ?? 0)
}

function isBlank(retro: Retro | undefined): boolean {
  return !([retro?.went_well, retro?.resistance, retro?.experiment].some((v) => (v ?? '').trim() !== ''))
}

/**
 * Bugun eksik kalan ve saati gelmis girisler. Gun bittiginde susmuyor: aksam
 * hala tarti yoksa iki hatirlatma birden acik kalir - girilmeyen sey unutulan seydir.
 */
export function pendingReminders(input: {
  log: DailyLog | undefined
  retro: Retro | undefined
  /** HH:MM, local. */
  now: string
  settings: ReminderSettings
  /** Bugunun gunu (0-6); bel hatirlatmasi icin. Verilmezse bel sorulmaz. */
  weekday?: number
  /** Son 7 gunde bel olculdu mu - olculduyse gun gelse de sorulmaz. */
  waist_logged_this_week?: boolean
  /** Bugunun ogun saatleri (HH:MM). Verilmezse aksam yemegi sorulmaz. */
  meal_times?: string[]
}): Reminder[] {
  if (!input.settings.enabled) return []
  const now = minutesOf(input.now)
  const due: Reminder[] = []
  if (now >= minutesOf(input.settings.weigh_at) && input.log?.weight_kg == null) {
    due.push({ id: 'weigh', ...TEXT.weigh })
  }
  if (now >= minutesOf(input.settings.retro_at) && isBlank(input.retro)) {
    due.push({ id: 'retro', ...TEXT.retro })
  }
  // Aksam yemegi retro saatinde sorulur: 24 Eyl'de kayit hic gelmedi, gun yarim kaldi.
  if (input.meal_times && now >= minutesOf(input.settings.retro_at) && !hasDinner(input.meal_times)) {
    due.push({ id: 'dinner', ...TEXT.dinner })
  }
  // Bel haftada bir: gunu geldiyse ve o hafta hic olculmediyse. Sabah tartisiyla
  // ayni saatte sorulur - ikisi de ac karnina, tek ayaga kalkis.
  if (
    // typeof kontrolu sart: gun verilmediginde `undefined === undefined` dogru
    // cikar ve bel her gun sorulur.
    typeof input.weekday === 'number' &&
    input.weekday === input.settings.waist_day &&
    now >= minutesOf(input.settings.weigh_at) &&
    input.log?.waist_cm == null &&
    !input.waist_logged_this_week
  ) {
    due.push({ id: 'waist', ...TEXT.waist })
  }
  return due
}

export function useReminderSettings(): ReminderSettings {
  const stored = useLiveQuery(() => db.settings.get('reminders'), [])
  return { ...DEFAULT_REMINDERS, ...((stored?.value as Partial<ReminderSettings> | undefined) ?? {}) }
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await db.settings.put({ key: 'reminders', value: settings })
  await scheduleNotifications(settings)
}

/**
 * Yerel bildirimi olan hatirlatmalar. Bel haftalik oldugu icin gunluk zincire
 * girmez; ekran karti olarak gorunur.
 * ponytail: haftalik bildirim isteniyorsa Capacitor `on: { weekday }` alani
 * eklenir - once o alanin gun numaralandirmasi cihazda dogrulanmali.
 */
type ScheduledReminder = 'weigh' | 'retro' | 'dinner'

const NOTIFICATION_IDS: Record<ScheduledReminder, number> = { weigh: 1, retro: 2, dinner: 3 }

/**
 * Bir sonraki atesleme ani, yerel saatle. Bugun girilmisse ya da saat gectiyse
 * yarin; ikisi de degilse bugun. Date alan alan kuruldugu icin ay/yil sonu
 * kendiliginde tasar ve toISOString() gun kaydirmasi olmaz.
 */
export function nextFireAt(time: string, done: boolean, now: Date): Date {
  const minutes = minutesOf(time)
  const passed = now.getHours() * 60 + now.getMinutes() >= minutes
  const day = now.getDate() + (done || passed ? 1 : 0)
  return new Date(now.getFullYear(), now.getMonth(), day, Math.floor(minutes / 60), minutes % 60, 0, 0)
}

/** Ayari okuyup bildirimleri gunun guncel verisine gore yeniden kurar. */
export async function refreshNotifications(): Promise<void> {
  if (!isNative()) return
  const row = await db.settings.get('reminders')
  await scheduleNotifications({ ...DEFAULT_REMINDERS, ...((row?.value as Partial<ReminderSettings> | undefined) ?? {}) })
}

/**
 * Gunluk yerel bildirim - yalniz APK'da. Tarayicida Notification API uygulama
 * kapaliyken atesleyemez, push ise sunucu ister; PWA tarafi ekran ustundeki
 * kartla yetinir (ui/Today).
 *
 * O gun veri girilmisse bugunun bildirimi atlanir ve zincir yarindan devam eder;
 * giris anindan sonra store.saveDaily/saveRetro burayi yeniden cagirir.
 *
 * ponytail: gun atlama yalnizca yeniden kurulum anindaki veriye bakar. Uygulama
 * gunlerce hic acilmazsa (veri sunucudan gelse bile) o gunler yine calar;
 * rahatsiz ederse arka plan gorevi gerekir.
 */
export async function scheduleNotifications(settings: ReminderSettings, now: Date = new Date()): Promise<void> {
  if (!isNative()) return
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  await LocalNotifications.cancel({ notifications: Object.values(NOTIFICATION_IDS).map((id) => ({ id })) })
  if (!settings.enabled) return

  const granted = await LocalNotifications.requestPermissions()
  if (granted.display !== 'granted') return

  const today = toLocalDate(now)
  const [log, retro, meals] = await Promise.all([
    db.daily_log.get(today),
    db.retro.get(today),
    db.meal.where('date').equals(today).toArray(),
  ])
  const done: Record<ScheduledReminder, boolean> = {
    weigh: log?.weight_kg != null,
    retro: !isBlank(retro),
    dinner: hasDinner(meals.map((m) => m.time)),
  }

  await LocalNotifications.schedule({
    notifications: (['weigh', 'retro', 'dinner'] as const).map((key) => ({
      id: NOTIFICATION_IDS[key],
      title: TEXT[key].title,
      body: TEXT[key].body,
      schedule: {
        at: nextFireAt(key === 'weigh' ? settings.weigh_at : settings.retro_at, done[key], now),
        repeats: true,
        every: 'day',
        allowWhileIdle: true,
      },
    })),
  })
}
