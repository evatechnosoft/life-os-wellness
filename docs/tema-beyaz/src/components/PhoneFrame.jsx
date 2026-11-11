export default function PhoneFrame({ label, children, className = '', statusTone = 'dark' }) {
  const tone = statusTone === 'dark' ? 'text-ink' : 'text-white';
  return (
    <figure className="flex flex-col items-start gap-3 shrink-0">
      <figcaption className="font-isans text-[12px] uppercase tracking-[0.18em] text-ink/60">
        {label}
      </figcaption>
      <div
        className={`relative w-[390px] h-[844px] overflow-hidden rounded-[48px] ring-1 ring-ink/20 ${className}`}
        role="region"
        aria-label={label}
      >
        <div className={`absolute top-0 inset-x-0 h-[48px] px-8 flex items-center justify-between z-30 font-isans text-[15px] font-semibold ${tone}`}>
          <span className="tnum">9:41</span>
          <span className="absolute left-1/2 -translate-x-1/2 top-[11px] w-[120px] h-[32px] rounded-full bg-black" />
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
              <rect x="0" y="7" width="3" height="4" rx="0.5" />
              <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
              <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" />
              <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none" stroke="currentColor">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3" opacity="0.4" />
              <rect x="2" y="2" width="15" height="8" rx="1.5" fill="currentColor" stroke="none" />
              <path d="M23 4v4" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            </svg>
          </span>
        </div>
        <div className="absolute inset-0 flex flex-col">{children}</div>
      </div>
    </figure>
  );
}
