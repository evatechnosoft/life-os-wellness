import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

import { lastDates, toLocalDate } from './lib/date'
import { db } from './lib/db'
import { syncActivity } from './lib/activity'
import { syncHealth } from './lib/health'
import { autoCheckPhoneUpdate, checkPhoneUpdate, drainWatch } from './lib/watch'
import { pullProfile } from './lib/profile'
import { pullSplit } from './lib/split'
import { refreshNotifications } from './lib/reminders'
import { hasServer, pullRange, startSyncLoop, syncOutbox } from './lib/store'
import { Eva } from './ui/Eva'
import { Exercises } from './ui/Exercises'
import { Settings } from './ui/Settings'
import { PullToRefresh } from './ui/PullToRefresh'
import { Today } from './ui/Today'
import { Week } from './ui/Week'

/* Ikonlar 24 kare stroke; label erisilebilirlik icin kalir, gozle kucuk. */
const TABS = [
  { id: 'today', label: 'Bugün', d: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  { id: 'chat', label: 'Eva', d: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z' },
  { id: 'moves', label: 'Hareket', d: 'M3 10v4M6 8v8M9 11h6M18 8v8M21 10v4M6 12h3M15 12h3' },
  { id: 'week', label: 'Hafta', d: 'M4 20V12M8 20V8M12 20v-4M16 20V6M20 20v-9' },
  { id: 'settings', label: 'Ayar', d: 'M4 7h10M18 7h2M4 12h2M10 12h10M4 17h10M18 17h2M14 5v4M6 10v4M14 15v4' },
] as const

type TabId = (typeof TABS)[number]['id']

export function App() {
  const [tab, setTab] = useState<TabId>('today')
  const [online, setOnline] = useState(navigator.onLine)
  const [date, setDate] = useState(toLocalDate())
  const [updateReady, setUpdateReady] = useState(false)
  const pending = useLiveQuery(() => db.outbox.count(), []) ?? 0

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    const stop = startSyncLoop()
    // Keep the header honest when the app stays open past midnight.
    const rollover = window.setInterval(() => setDate(toLocalDate()), 60_000)
    // 30 gun: hafta ekrani 7 gunu cizer ama gecmis ictihat (kilo egilimi, Eva'nin
    // ozeti) daha genis pencere ister; satir sayisi kucuk oldugu icin ucuz.
    const window30 = lastDates(30)
    if (hasServer()) {
      void pullRange(window30[0]!, window30[window30.length - 1]!).catch(() => {})
      void pullSplit().catch(() => {})
      void pullProfile().catch(() => {})
    }
    // Telefon bildirimleri her acilista yeniden kurulur: kullanici saati Ayar'dan
    // degistirmemis olsa da ilk kurulumda ve APK guncellemesinden sonra gerekiyor.
    void refreshNotifications().catch(() => {})
    // Watch data on launch and every 15 min while the app stays open.
    // Telefonun hareket olaylari ayni ritimde toplanir; syncHealth bu araliklari
    // yuksek nabiz penceresini eslestirmek icin okur, o yuzden once bu kosar.
    const sync = async () => {
      await syncActivity().catch(() => {})
      await syncHealth().catch(() => {})
      // Saatteki uygulamanin kuyrugu: telefon servisi her kosulda topluyor, JS acilinca boşaltır.
      await drainWatch().catch(() => {})
    }
    void sync()
    // Telefon guncellemesi: acilista bir kez, sonra en fazla gunde bir (lib/watch.ts).
    // Guncelleme yoksa hicbir sey gosterilmiyor - yalnizca Ayar sekmesine bir nokta duser.
    void autoCheckPhoneUpdate()
      .then((u) => setUpdateReady(u?.state === 'available'))
      .catch(() => {})
    const health = window.setInterval(() => void sync(), 900_000)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      window.clearInterval(rollover)
      window.clearInterval(health)
      stop()
    }
  }, [])

  /**
   * Asagi cekip birakinca: kuyrugu bosalt, sunucudan 30 gunu tazele, OTA manifestine
   * TEKRAR bak. `checkPhoneUpdate` gunluk onbellegi atlar - kullanici yenilemeyi
   * kendisi istediyse "bugun zaten baktim" cevabi dogru cevap degildir.
   */
  const refresh = async (): Promise<void> => {
    const window30 = lastDates(30)
    if (hasServer()) {
      await syncOutbox()
      await pullRange(window30[0]!, window30[window30.length - 1]!).catch(() => {})
      await pullSplit().catch(() => {})
      await pullProfile().catch(() => {})
    }
    const update = await checkPhoneUpdate().catch(() => null)
    setUpdateReady(update?.state === 'available')
    setDate(toLocalDate())
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-baseline justify-between px-4 pt-6 pb-1">
        <h1 className="accent-text text-2xl font-semibold tracking-tight">{date}</h1>
        <span className={online ? 'text-xs text-ink-faint' : 'text-xs text-a3'}>
          {online ? (pending > 0 ? `${pending} kayıt senkronda` : 'çevrimiçi') : `çevrimdışı — ${pending} kayıt kuyrukta`}
        </span>
      </header>

      <main className="flex-1 px-4 pb-24">
        <PullToRefresh onRefresh={refresh}>
          {tab === 'today' && <Today date={date} />}
          {tab === 'chat' && <Eva />}
          {tab === 'moves' && <Exercises />}
          {tab === 'week' && <Week />}
          {tab === 'settings' && <Settings />}
        </PullToRefresh>
      </main>

      {/* Floating nav pill (evaglass tokens: component.navButton + blur.nav). */}
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div role="tablist" aria-label="Bölümler" className="glass-nav pointer-events-auto flex gap-1 p-1.5">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={t.label}
                onClick={() => setTab(t.id)}
                className={`relative flex size-12 flex-col items-center justify-center rounded-full transition-[background-color,transform,color] duration-300 ease-out ${
                  active ? 'scale-110 bg-glass-strong text-a1 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]' : 'text-ink-faint active:scale-95'
                }`}
              >
                <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={t.d} />
                </svg>
                <span className={`mt-0.5 text-[9px] leading-none ${active ? 'text-ink' : ''}`}>{t.label}</span>
                {t.id === 'settings' && updateReady && (
                  <span aria-label="güncelleme var" className="absolute top-2 right-2 size-1.5 rounded-full bg-a1" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
