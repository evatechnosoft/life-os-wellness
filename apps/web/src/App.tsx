import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

import { lastDates, toLocalDate } from './lib/date'
import { db } from './lib/db'
import { hasServer, pullRange, startSyncLoop } from './lib/store'
import { Settings } from './ui/Settings'
import { Today } from './ui/Today'
import { Week } from './ui/Week'

const TABS = [
  { id: 'today', label: 'Bugün' },
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
    const window7 = lastDates(7)
    if (hasServer()) void pullRange(window7[0]!, window7[window7.length - 1]!).catch(() => {})
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      window.clearInterval(rollover)
      stop()
    }
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-baseline justify-between px-4 pt-6 pb-1">
        <h1 className="text-lg font-semibold">{date}</h1>
        <span className={online ? 'text-xs text-slate-500' : 'text-xs text-amber-400'}>
          {online ? (pending > 0 ? `${pending} kayıt senkronda` : 'çevrimiçi') : `çevrimdışı — ${pending} kayıt kuyrukta`}
        </span>
      </header>

      <main className="flex-1 px-4 pb-24">
        {tab === 'today' && <Today date={date} />}
        {tab === 'week' && <Week />}
        {tab === 'settings' && <Settings />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md border-t border-slate-800 bg-slate-950 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 py-4 text-sm ${tab === t.id ? 'text-slate-100' : 'text-slate-500'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
