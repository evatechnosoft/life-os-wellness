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

const TABS = [
  { id: 'today', label: 'Bugün' },
  { id: 'chat', label: 'Eva' },
  { id: 'moves', label: 'Hareket' },
  { id: 'week', label: 'Hafta' },
  { id: 'settings', label: 'Ayar' },
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
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`min-h-11 rounded-pill px-3.5 text-sm ${
                tab === t.id ? 'bg-glass-strong text-ink' : 'text-ink-faint'
              }`}
            >
              {t.label}
              {t.id === 'settings' && updateReady && (
                <span aria-label="güncelleme var" className="ml-1 inline-block size-1.5 rounded-full bg-a1 align-middle" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
