import Card from '../components/Card.jsx'
import { timeline } from '../data/takipData.js'

export default function Page2A() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Takip</h1>
        <p className="text-white/40 text-sm">Bugünün zaman çizelgesi</p>
      </div>

      <Card className="py-5">
        <div className="flex flex-col">
          {timeline.map((item, i) => (
            <TimelineRow key={item.id} item={item} isLast={i === timeline.length - 1} />
          ))}
        </div>
      </Card>
    </div>
  )
}

function TimelineRow({ item, isLast }) {
  const isDone = item.status === 'done'
  const isCurrent = item.status === 'current'

  const dotColor = isDone ? 'bg-teal' : isCurrent ? 'bg-indigo' : 'bg-white/15'
  const lineColor = isDone ? 'bg-teal/40' : 'bg-white/10'

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-3.5 h-3.5 rounded-full shrink-0 ${dotColor} ${
            isCurrent ? 'ring-4 ring-indigo/25' : ''
          }`}
        />
        {!isLast && <div className={`w-0.5 flex-1 ${lineColor}`} style={{ minHeight: 28 }} />}
      </div>

      <div className={`flex-1 ${isLast ? '' : 'pb-5'}`}>
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-semibold ${
              isCurrent ? 'text-indigo' : isDone ? 'text-white/90' : 'text-white/50'
            }`}
          >
            {item.title}
          </span>
          <span className="text-xs text-white/30">{item.time}</span>
        </div>
        <p className={`text-xs mt-0.5 ${isCurrent ? 'text-indigo/70' : 'text-white/35'}`}>
          {isCurrent ? `Şimdi: ${item.detail}` : item.detail}
        </p>
      </div>
    </div>
  )
}
