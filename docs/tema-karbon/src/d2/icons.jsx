// Toprak ikon seti – yumuşak, dolgulu, organik formlar (çakıl taşı / yaprak hissi)
const S = ({ children, size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    {children}
  </svg>
);

export const IGunes = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="5.5" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <rect key={a} x="11" y="1.5" width="2" height="3.5" rx="1" transform={`rotate(${a} 12 12)`} opacity=".55" />
    ))}
  </S>
);

export const ITakvim = (p) => (
  <S {...p}>
    <path d="M5 5.5h14a2.5 2.5 0 0 1 2.5 2.5v10A2.5 2.5 0 0 1 19 20.5H5A2.5 2.5 0 0 1 2.5 18V8A2.5 2.5 0 0 1 5 5.5Z" opacity=".4" />
    <rect x="2.5" y="5.5" width="19" height="4.5" rx="2.2" />
    <circle cx="8" cy="14.5" r="1.6" />
    <circle cx="12" cy="14.5" r="1.6" />
  </S>
);

export const IOlcu = (p) => (
  <S {...p}>
    <path d="M12 3a9 9 0 0 1 9 9h-3.2A5.8 5.8 0 0 0 12 6.2Z" />
    <path d="M3 12a9 9 0 0 1 9-9v3.2A5.8 5.8 0 0 0 6.2 12Z" opacity=".45" />
    <path d="M11 12.5 16 8l-3.5 6a1.7 1.7 0 1 1-1.5-1.5Z" />
    <rect x="3" y="17" width="18" height="3" rx="1.5" opacity=".45" />
  </S>
);

export const IKocY = (p) => (
  <S {...p}>
    <path d="M12 2.5C7 5 4.5 9 4.5 13.5A7.5 7.5 0 0 0 12 21a7.5 7.5 0 0 0 7.5-7.5C19.5 9 17 5 12 2.5Z" opacity=".45" />
    <path d="M12 6v15a7.5 7.5 0 0 0 7.5-7.5C19.5 10 16.5 7.5 12 6Z" />
  </S>
);

export const IArti = (p) => (
  <S {...p}>
    <rect x="10.25" y="4" width="3.5" height="16" rx="1.75" />
    <rect x="4" y="10.25" width="16" height="3.5" rx="1.75" />
  </S>
);

export const IOk = (p) => (
  <S {...p}>
    <path d="M9 5.5a1.5 1.5 0 0 1 2.3-.2l5.5 5.6a1.6 1.6 0 0 1 0 2.2l-5.5 5.6A1.5 1.5 0 0 1 9 16.6L13.5 12 9 7.4a1.5 1.5 0 0 1 0-1.9Z" />
  </S>
);

export const ITik = (p) => (
  <S {...p}>
    <path d="M4.3 12.6a1.6 1.6 0 0 1 2.3-.1l3 2.9 7.8-8.3a1.6 1.6 0 1 1 2.3 2.2l-9 9.5a1.6 1.6 0 0 1-2.3 0l-4.1-4a1.6 1.6 0 0 1 0-2.2Z" />
  </S>
);

export const IOynat = (p) => (
  <S {...p}>
    <path d="M7 4.8c0-1.2 1.3-1.9 2.3-1.3l10 6.9c.9.6.9 2 0 2.6l-10 6.9c-1 .7-2.3 0-2.3-1.2Z" />
  </S>
);

export const ICop = (p) => (
  <S {...p}>
    <rect x="3" y="4.5" width="18" height="3" rx="1.5" />
    <path d="M9.5 2.5h5a1 1 0 0 1 1 1v1h-7v-1a1 1 0 0 1 1-1Z" />
    <path d="M5 9h14l-1.1 10.3A2 2 0 0 1 15.9 21H8.1a2 2 0 0 1-2-1.7Z" opacity=".85" />
  </S>
);

export const IAy = (p) => (
  <S {...p}>
    <path d="M14.5 3a8.5 8.5 0 1 0 6.5 13.9A7 7 0 0 1 14.5 3Z" />
  </S>
);

export const IKalp = (p) => (
  <S {...p}>
    <path d="M12 20.5s-8-4.8-8-10.6A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8 2.6c0 5.8-8 10.6-8 10.6Z" />
  </S>
);

export const IYaprak = (p) => (
  <S {...p}>
    <path d="M20 4C10 4 4 9 4 16c0 1.5.4 2.8 1 4 1-4 4-7.5 9-9.5-4 2.8-6.3 6-7 9.5 1 .3 2 .5 3 .5 7 0 10-7 10-16.5Z" />
  </S>
);

export const IKapat = (p) => (
  <S {...p}>
    <rect x="10.25" y="3" width="3.5" height="18" rx="1.75" transform="rotate(45 12 12)" />
    <rect x="10.25" y="3" width="3.5" height="18" rx="1.75" transform="rotate(-45 12 12)" />
  </S>
);
