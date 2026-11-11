import { useEffect } from 'react';
import { Label } from './parts.jsx';

// Alt sayfa: düz yüzey, üst kenar çizgisi, blur yok
export default function Sheet({ open, onClose, title, ust, children }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);

  return (
    <div className={`absolute inset-0 z-20 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <button
        tabIndex={open ? 0 : -1}
        aria-label="Kapat"
        onClick={onClose}
        className={`absolute inset-0 bg-k0/70 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-x-0 bottom-0 rounded-t-[16px] border-t border-kl bg-k2 px-5 pb-[34px] pt-3 transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto mb-4 h-[4px] w-10 rounded-sm bg-kl" />
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Label className="text-ko">{ust}</Label>
            <h2 className="font-grotesk text-[20px] font-semibold">{title}</h2>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
