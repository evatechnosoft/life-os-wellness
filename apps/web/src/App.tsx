import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

import { lastDates, toLocalDate } from './lib/date'
import { db } from './lib/db'
import { syncHealth } from './lib/health'
import { pullSplit } from './lib/split'
import { hasServer, pullRange, startSyncLoop } from './lib/store'
import { Eva } from './ui/Eva'
import { Settings } from './ui/Settings'
import { Today } from './ui/Today'
import { Week } from './ui/Week'

const TABS = [
  { id: 'today', label: 'Bugün' },
  { id: 'chat', label: 'Eva' },
  { id: 'week', label: 'Hafta' },
  { id: 'settings', label: 'Ayar' },
] as const

type TabId = (typeof TABS)[number]['id']

export function App() {
  const [tab, setTab] = useState<TabId>('today')
  const [online, setOnline] = useState(navigator.onLine)
  const [date, setDate] = useState(toLocalDate())
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
    }
    // Watch data on launch and every 15 min while the app stays open.
    void syncHealth().catch(() => {})
    const health = window.setInterval(() => void syncHealth().catch(() => {}), 900_000)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      window.clearInterval(rollover)
      window.clearInterval(health)
      stop()
    }
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-baseline justify-between px-4 pt-6 pb-1">
        <h1 className="accent-text text-2xl font-semibold tracking-tight">{date}</h1>
        <span className={online ? 'text-xs text-ink-faint' : 'text-xs text-a3'}>
          {online ? (pending > 0 ? `${pending} kayıt senkronda` : 'çevrimiçi') : `çevrimdışı — ${pending} kayıt kuyrukta`}
        </span>
      </header>

      <main className="flex-1 px-4 pb-24">
        {tab === 'today' && <Today date={date} />}
        {tab === 'chat' && <Eva />}
        {tab === 'week' && <Week />}
        {tab === 'settings' && <Settings />}
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
              className={`min-h-11 rounded-pill px-5 text-sm ${
                tab === t.id ? 'bg-glass-strong text-ink' : 'text-ink-faint'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
