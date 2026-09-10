/**
 * Eva - our own face for the app. Aurora gradient ring around a calm waveform;
 * no stock illustration, no chat-bubble mascot. The ring animates only while listening.
 */
export function Avatar({ listening = false, size = 56 }: { listening?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Eva"
      className={listening ? 'animate-pulse' : undefined}
    >
      <defs>
        <linearGradient id="eva-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>

      <circle cx="32" cy="32" r="29" fill="none" stroke="url(#eva-ring)" strokeWidth="2.5" opacity="0.9" />
      <circle cx="32" cy="32" r="24" fill="rgba(255,255,255,0.05)" />

      {/* A breathing waveform: quiet when idle, taller bars while listening. */}
      <g stroke="url(#eva-ring)" strokeWidth="3" strokeLinecap="round">
        <line x1="22" y1={listening ? 26 : 30} x2="22" y2={listening ? 38 : 34} />
        <line x1="27" y1={listening ? 21 : 28} x2="27" y2={listening ? 43 : 36} />
        <line x1="32" y1={listening ? 18 : 26} x2="32" y2={listening ? 46 : 38} />
        <line x1="37" y1={listening ? 21 : 28} x2="37" y2={listening ? 43 : 36} />
        <line x1="42" y1={listening ? 26 : 30} x2="42" y2={listening ? 38 : 34} />
      </g>
    </svg>
  )
}
