// Nötr cihaz çerçevesi – içerik 390×844
export default function PhoneFrame({ label, children, bg = '#000' }) {
  return (
    <figure className="flex shrink-0 flex-col gap-3">
      <figcaption className="flex items-center justify-between px-1 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
        <span>{label}</span>
        <span className="tnum">390 × 844</span>
      </figcaption>
      <div className="rounded-[52px] bg-neutral-800 p-[10px] ring-1 ring-neutral-700">
        <div
          className="relative h-[844px] w-[390px] overflow-hidden rounded-[42px]"
          style={{ background: bg }}
        >
          {children}
        </div>
      </div>
    </figure>
  );
}

export function PanelFrame({ label, children, width = 560 }) {
  return (
    <figure className="flex shrink-0 flex-col gap-3" style={{ width }}>
      <figcaption className="flex items-center justify-between px-1 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
        <span>{label}</span>
        <span>Durumlar</span>
      </figcaption>
      {children}
    </figure>
  );
}
