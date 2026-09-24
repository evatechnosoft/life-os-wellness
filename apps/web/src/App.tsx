import { Capacitor } from '@capacitor/core'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

import { lastDates, toLocalDate } from './lib/date'
import { db } from './lib/db'
import { syncActivity } from './lib/activity'
import { scheduleBackgroundSync, syncHealth } from './lib/health'
import { autoCheckPhoneUpdate, checkPhoneUpdate, drainWatch, installPhoneUpdate, type PhoneUpdate } from './lib/watch'
import { pullProfile } from './lib/profile'
import { pullGoals } from './lib/settings'
import { pullSplit } from './lib/split'
import { refreshNotifications } from './lib/reminders'
import { REJECTED_KEY, hasServer, pullRange, startSyncLoop, syncOutbox } from './lib/store'
import { syncBadge } from './lib/syncStatus'
import { pullWorkoutPlan } from './lib/workoutPlan'
import { Drawer, type DrawerPage } from './ui/Drawer'
import { Eva } from './ui/Eva'
import { Exercises } from './ui/Exercises'
import { Plan } from './ui/Plan'
import { QuickAdd } from './ui/QuickAdd'
import { Settings } from './ui/Settings'
import { PullToRefresh } from './ui/PullToRefresh'
import { Today } from './ui/Today'
import { Week } from './ui/Week'

/* Ikonlar 24 kare stroke; label erisilebilirlik icin kalir, gozle kucuk. */
const TABS = [
  { id: 'today', label: 'Bugün', d: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  { id: 'plan', label: 'Plan', d: 'M4 5h16M4 5v14h16V5M9 5v14M4 10h16' },
  { id: 'week', label: 'Ölçüm', d: 'M4 20V12M8 20V8M12 20v-4M16 20V6M20 20v-9' },
  { id: 'chat', label: 'Koç', d: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z' },
] as const

// Ikincil sayfalar alt cubukta degil drawer'da (spec S2: gunluk is dort sekme).
const PAGES: DrawerPage[] = [
  { id: 'moves', label: 'Hareket kütüphanesi', hint: 'Kas haritası ve arama' },
  { id: 'settings', label: 'Ayarlar', hint: 'Hedefler, saat, veri' },
]

type TabId = (typeof TABS)[number]['id']
type PageId = (typeof PAGES)[number]['id']

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
  const [menu, setMenu] = useState(false)
  // ?page=moves ile dogrudan bir drawer sayfasi acilir (kisayol, ekran dogrulamasi).
  const [page, setPage] = useState<PageId | null>(() => {
    const wanted = new URLSearchParams(window.location.search).get('page')
    return PAGES.some((p) => p.id === wanted) ? (wanted as PageId) : null
  })
  const pending = useLiveQuery(() => db.outbox.count(), []) ?? 0
  const lastWatchSync = useLiveQuery(async () => {
    const rows = await db.wearable.filter((r) => r.source === 'health_connect').toArray()
    return rows.reduce<string | null>((max, r) => (max === null || r.synced_at > max ? r.synced_at : max), null)
  }, [])
  const rejected = useLiveQuery(() => db.settings.get(REJECTED_KEY), [])
  const rejectedList = (rejected?.value as { path: string; reason: string }[] | undefined) ?? []
  const badge = syncBadge({
    native: Capacitor.isNativePlatform(),
    lastWatchSync: lastWatchSync ?? null,
    rejected: rejectedList.length,
    now: Date.now(),
  })
  // Reddedilen kayit sunucuya hic ulasmadi; nedenini gostermeden silmek bilgiyi de siler.
  const showRejected = async (): Promise<void> => {
    const lines = rejectedList.map((r) => `${r.path}: ${r.reason}`).join('\n')
    if (window.confirm(`Sunucu bu kayıtları reddetti:\n${lines}\n\nListeyi temizle?`)) {
      await db.settings.delete(REJECTED_KEY)
    }
  }

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
      void pullWorkoutPlan().catch(() => {})
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
    // Arka plan senkronu: uygulama kapaliyken de 8 saatte bir olcum aksin.
    void scheduleBackgroundSync().catch(() => {})
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
      await pullWorkoutPlan().catch(() => {})
      await pullProfile().catch(() => {})
      await pullGoals().catch(() => {})
    }
    setUpdate(await checkPhoneUpdate().catch(() => null))
    setDate(toLocalDate())
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-center justify-between px-4 pt-6 pb-1">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Menü" onClick={() => setMenu(true)}
            className="-ml-1 flex size-9 items-center justify-center rounded-field text-ink-dim active:bg-glass">
            <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">{date}</h1>
        </div>
        {badge ? (
          <button type="button" onClick={() => badge.tone === 'error' && void showRejected()}
            className={badge.tone === 'error' ? 'text-xs text-load' : 'text-xs text-a3'}>
            {badge.text}
          </button>
        ) : (
          <span className={online ? 'text-xs text-ink-faint' : 'text-xs text-a3'}>
            {online ? (pending > 0 ? `${pending} kayıt senkronda` : 'çevrimiçi') : `çevrimdışı — ${pending} kayıt kuyrukta`}
          </span>
        )}
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
          {page === null && tab === 'today' && <Today date={date} />}
          {page === null && tab === 'plan' && <Plan />}
          {page === null && tab === 'week' && <Week />}
          {page === null && tab === 'chat' && <Eva />}
          {page === 'moves' && <Exercises />}
          {page === 'settings' && <Settings />}
        </PullToRefresh>
      </main>

      {/* Floating nav pill (evaglass tokens: component.navButton + blur.nav). */}
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div role="tablist" aria-label="Bölümler" className="glass-nav pointer-events-auto flex items-end gap-1 p-1.5">
          {TABS.map((t) => {
            const active = tab === t.id && page === null
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={t.label}
                onClick={() => { setTab(t.id); setPage(null) }}
                className={`relative flex size-12 flex-col items-center justify-center rounded-full transition-colors duration-200 ${
                  active ? 'bg-a1 text-solid' : 'text-ink-faint active:bg-glass'
                }`}
              >
                <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={t.d} />
                </svg>
                <span className={`mt-0.5 text-[9px] leading-none ${active ? 'text-ink' : ''}`}>{t.label}</span>
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

      <Drawer open={menu} pages={PAGES} onPick={(id) => setPage(id as PageId)} onClose={() => setMenu(false)} />
      <QuickAdd date={date} open={quickAdd} onClose={() => setQuickAdd(false)} />
    </div>
  )
}
