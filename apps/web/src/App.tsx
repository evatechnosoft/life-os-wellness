import { useEffect, useState } from 'react'

import { toLocalDate } from './lib/date'

const TABS = [
  { id: 'today', label: 'Bugün' },
  { id: 'week', label: 'Hafta' },
  { id: 'settings', label: 'Ayar' },
] as const

type TabId = (typeof TABS)[number]['id']

export function App() {
  const [tab, setTab] = useState<TabId>('today')
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-baseline justify-between px-4 pt-6 pb-2">
        <h1 className="text-lg font-semibold">{toLocalDate()}</h1>
        <span className={online ? 'text-xs text-slate-500' : 'text-xs text-amber-400'}>
          {online ? 'çevrimiçi' : 'çevrimdışı — kayıtlar kuyrukta'}
        </span>
      </header>

      <main className="flex-1 px-4 pb-24">
        {/* Sprint 2 fills Bugün, Sprint 3 fills Hafta, Sprint 4 fills Ayar. */}
        <p className="pt-16 text-center text-sm text-slate-500">
          {TABS.find((t) => t.id === tab)?.label} ekranı henüz boş.
        </p>
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
