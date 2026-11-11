import { useState } from 'react'
import CanvasSwitcher from './components/CanvasSwitcher.jsx'
import PhoneFrame from './components/PhoneFrame.jsx'
import BottomNav from './components/BottomNav.jsx'
import Page1A from './pages/Page1A.jsx'
import Page1B from './pages/Page1B.jsx'
import Page2A from './pages/Page2A.jsx'
import Page2B from './pages/Page2B.jsx'
import Page3A from './pages/Page3A.jsx'
import Page3B from './pages/Page3B.jsx'

const screens = {
  '1A': { label: '1A', render: () => <Page1A /> },
  '1B': { label: '1B', render: () => <Page1B /> },
  '2A': { label: '2A', render: () => <Page2A /> },
  '2B': { label: '2B', render: () => <Page2B /> },
  '3A': { label: '3A', render: () => <Page3A /> },
  '3B': { label: '3B', render: () => <Page3B /> },
}

export default function App() {
  const [mode, setMode] = useState(new URLSearchParams(location.search).get('v') || '1A') // ?v=2B or ?v=all for direct links

  return (
    <div className="min-h-screen bg-bg pb-12">
      <CanvasSwitcher mode={mode} onChange={setMode} />

      {mode === 'all' ? (
        <div className="flex flex-wrap gap-8 justify-center px-4">
          {Object.values(screens).map((s) => (
            <PhoneFrame key={s.label} label={s.label}>
              {s.render()}
              <BottomNav active="bugun" />
            </PhoneFrame>
          ))}
        </div>
      ) : (
        <div className="flex justify-center px-4">
          <PhoneFrame label={screens[mode].label}>
            {screens[mode].render()}
            <BottomNav active="bugun" />
          </PhoneFrame>
        </div>
      )}
    </div>
  )
}
