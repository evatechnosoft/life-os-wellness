export default function Bar({ progress, color = '#2dd4bf', height = 10 }) {
  const clamped = Math.max(0, Math.min(1, progress))
  return (
    <div
      className="w-full rounded-full bg-white/[.07] overflow-hidden"
      style={{ height }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${clamped * 100}%`,
          background: color,
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  )
}

export function VerticalBar({ progress, color = '#2dd4bf', width = 10, height = 80 }) {
  const clamped = Math.max(0, Math.min(1, progress))
  return (
    <div
      className="rounded-full bg-white/[.07] overflow-hidden flex items-end"
      style={{ width, height }}
    >
      <div
        className="w-full rounded-full"
        style={{
          height: `${clamped * 100}%`,
          background: color,
          transition: 'height 0.6s ease',
        }}
      />
    </div>
  )
}
