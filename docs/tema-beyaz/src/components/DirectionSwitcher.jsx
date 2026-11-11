export default function DirectionSwitcher({ directions, active, onChange }) {
  return (
    <div role="tablist" aria-label="Tasarım yönleri" className="inline-flex border border-ink/80 rounded-full p-1 bg-paper">
      {directions.map((d) => {
        const on = d.id === active;
        return (
          <button
            key={d.id}
            role="tab"
            aria-selected={on}
            disabled={d.disabled}
            onClick={() => onChange(d.id)}
            className={`px-5 h-10 rounded-full font-isans text-[14px] transition-colors flex items-center gap-2
              ${on ? 'bg-ink text-paper' : 'text-ink hover:bg-ink/5'}
              disabled:text-ink/35 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
          >
            <span className="tnum text-[11px] tracking-[0.14em] opacity-70">{d.code}</span>
            <span className="font-fraunces italic text-[17px]">{d.name}</span>
          </button>
        );
      })}
    </div>
  );
}
