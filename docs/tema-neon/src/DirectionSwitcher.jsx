export default function DirectionSwitcher({ directions, value, onChange }) {
  const onKey = (e) => {
    const i = directions.findIndex((d) => d.id === value);
    if (e.key === 'ArrowRight') onChange(directions[(i + 1) % directions.length].id);
    if (e.key === 'ArrowLeft') onChange(directions[(i - 1 + directions.length) % directions.length].id);
  };
  return (
    <div role="tablist" aria-label="Tasarım yönü" onKeyDown={onKey} className="inline-flex gap-2 p-1.5 bg-[#111] border border-white/10 rounded-[14px]">
      {directions.map((d) => {
        const act = d.id === value;
        return (
          <button
            key={d.id}
            role="tab"
            aria-selected={act}
            tabIndex={act ? 0 : -1}
            onClick={() => onChange(d.id)}
            className={`px-4 h-11 rounded-[10px] text-[14px] font-semibold transition-colors ${act ? 'bg-[#F4F4F0] text-black' : 'text-[rgba(244,244,240,.74)] hover:text-white'}`}
          >
            <span className="f-mono text-[11px] mr-2 opacity-70">{d.code}</span>
            {d.name}
          </button>
        );
      })}
    </div>
  );
}
