import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

import { lastDates, toLocalDate } from './lib/date'
import { db } from './lib/db'
import { syncActivity } from './lib/activity'
import { syncHealth } from './lib/health'
import { autoCheckPhoneUpdate, checkPhoneUpdate, drainWatch, installPhoneUpdate, type PhoneUpdate } from './lib/watch'
import { pullProfile } from './lib/profile'
import { pullGoals } from './lib/settings'
import { pullSplit } from './lib/split'
import { refreshNotifications } from './lib/reminders'
import { hasServer, pullRange, startSyncLoop, syncOutbox } from './lib/store'
import { Eva } from './ui/Eva'
import { Exercises } from './ui/Exercises'
import { QuickAdd } from './ui/QuickAdd'
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

/** Kenardan ortaya: 0 = uc, 2 = orta. */
const SCALE = [
  { box: 'size-10', icon: 'size-4' },
  { box: 'size-11', icon: 'size-[18px]' },
  { box: 'size-12', icon: 'size-5' },
] as const

type TabId = (typeof TABS)[number]['id']

export function App() {
  // ?tab=moves ile dogrudan bir bolume acilir: kisayol ve ekran dogrulamasi icin.
  const [tab, setTab] = useState<TabId>(() => {
    const wanted = new URLSearchParams(window.location.search).get('tab')
    return TABS.some((t) => t.id === wanted) ? (wanted as TabId) : 'today'
  })
  const [online, setOnline] = useState(navigator.onLine)
  const [date, setDate] = useState(toLocalDate())
  const [update, setUpdate] = useState<PhoneUpdate | null>(null)
  const [installing, setInstalling] = useState(false)
  const updateReady = update?.state === 'available'
  const [quickAdd, setQuickAdd] = useState(false)
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
      void pullGoals().catch(() => {})
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
      .then((u) => setUpdate(u ?? null))
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
      await pullGoals().catch(() => {})
    }
    setUpdate(await checkPhoneUpdate().catch(() => null))
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

      {updateReady && (
        <div className="mx-4 mb-2 flex items-center justify-between rounded-field bg-glass-strong px-4 py-3 text-sm">
          <span>Yeni sürüm {update.versionName ?? ''} hazır</span>
          <button
            type="button"
            disabled={installing}
            onClick={() =>
              void (async () => {
                setInstalling(true)
                try {
                  await installPhoneUpdate()
                  setUpdate(await checkPhoneUpdate().catch(() => null))
                } finally {
                  setInstalling(false)
                }
              })()
            }
            className="rounded-full bg-a1 px-4 py-1.5 font-medium text-solid disabled:opacity-50"
          >
            {installing ? 'İndiriliyor…' : 'Güncelle'}
          </button>
        </div>
      )}
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
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div role="tablist" aria-label="Bölümler" className="glass-nav pointer-events-auto flex items-end gap-1 p-1.5">
          {TABS.map((t, i) => {
            const active = tab === t.id
            // Kenardan ortaya buyuyen ritim (Dean, 19 Eylul): kucuk - orta - buyuk - orta - kucuk.
            const step = SCALE[Math.min(i, TABS.length - 1 - i)] ?? SCALE[2]
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={t.label}
                onClick={() => setTab(t.id)}
                className={`relative flex ${step.box} flex-col items-center justify-center rounded-full transition-[background-color,transform,color] duration-300 ease-out ${
                  active ? 'scale-110 bg-glass-strong text-a1 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]' : 'text-ink-faint active:scale-95'
                }`}
              >
                <svg viewBox="0 0 24 24" aria-hidden className={step.icon} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
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
        <button
          type="button"
          aria-label="Hızlı ekle"
          onClick={() => setQuickAdd(true)}
          className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-a1 text-2xl leading-none text-solid shadow-[0_10px_24px_rgba(45,212,191,0.35)] active:scale-95"
        >
          +
        </button>
      </nav>

      <QuickAdd date={date} open={quickAdd} onClose={() => setQuickAdd(false)} />
    </div>
  )
}
