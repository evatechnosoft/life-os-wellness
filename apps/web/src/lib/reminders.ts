import { useLiveQuery } from 'dexie-react-hooks'

import { db, type DailyLog, type Retro } from './db'
import { isNative } from './health'

export interface ReminderSettings {
  enabled: boolean
  /** HH:MM, local. */
  weigh_at: string
  retro_at: string
}

export const DEFAULT_REMINDERS: ReminderSettings = { enabled: true, weigh_at: '09:00', retro_at: '21:00' }

export interface Reminder {
  id: 'weigh' | 'retro'
  title: string
  body: string
}

const TEXT: Record<Reminder['id'], Omit<Reminder, 'id'>> = {
  weigh: { title: 'Sabah tartısı', body: 'Aç karnına tartıldın mı? Kiloyu gir.' },
  retro: { title: 'Akşam retrosu', body: 'Bugün ne iyi gitti, nerede zorlandın?' },
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

const NOTIFICATION_IDS: Record<Reminder['id'], number> = { weigh: 1, retro: 2 }

/**
 * Gunluk yerel bildirim - yalniz APK'da. Tarayicida Notification API uygulama
 * kapaliyken atesleyemez, push ise sunucu ister; PWA tarafi ekran ustundeki
 * kartla yetinir (ui/Today).
 *
 * ponytail: bildirim her gun ayni saatte tekrarlar, o gun kilo girilmis olsa da.
 * Girilen gunu susturmak icin saveDaily sonrasi tek seferlik yeniden kurulum gerekir;
 * rahatsiz edici bulunursa o zaman eklenir.
 */
export async function scheduleNotifications(settings: ReminderSettings): Promise<void> {
  if (!isNative()) return
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  await LocalNotifications.cancel({ notifications: Object.values(NOTIFICATION_IDS).map((id) => ({ id })) })
  if (!settings.enabled) return

  const granted = await LocalNotifications.requestPermissions()
  if (granted.display !== 'granted') return

  await LocalNotifications.schedule({
    notifications: (['weigh', 'retro'] as const).map((key) => ({
      id: NOTIFICATION_IDS[key],
      title: TEXT[key].title,
      body: TEXT[key].body,
      schedule: {
        on: {
          hour: Math.floor(minutesOf(key === 'weigh' ? settings.weigh_at : settings.retro_at) / 60),
          minute: minutesOf(key === 'weigh' ? settings.weigh_at : settings.retro_at) % 60,
        },
        allowWhileIdle: true,
      },
    })),
  })
}
