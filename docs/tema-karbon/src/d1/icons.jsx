import { c } from '../theme.js';
// Karbon ikon seti – kalın, köşeli, dolgulu geometrik glifler (ince outline değil)
const S = ({ children, size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

export const IBugun = (p) => (
  <S {...p}>
    <rect x="2" y="2" width="7" height="7" />
    <rect x="11" y="2" width="7" height="7" opacity=".45" />
    <rect x="2" y="11" width="7" height="7" opacity=".45" />
    <rect x="11" y="11" width="7" height="7" opacity=".45" />
  </S>
);

export const IPlan = (p) => (
  <S {...p}>
    <rect x="2" y="3" width="16" height="3" />
    <rect x="2" y="9" width="11" height="3" opacity=".6" />
    <rect x="2" y="15" width="7" height="3" opacity=".35" />
  </S>
);

export const IOlcum = (p) => (
  <S {...p}>
    <rect x="2" y="12" width="3" height="6" />
    <rect x="6.5" y="8" width="3" height="10" />
    <rect x="11" y="4" width="3" height="14" />
    <rect x="15.5" y="9" width="3" height="9" opacity=".45" />
  </S>
);

export const IKoc = (p) => (
  <S {...p}>
    <path d="M2 3h16v11h-7l-5 4v-4H2z" />
    <rect x="5" y="7" width="10" height="2" fill={c.kon} />
  </S>
);

export const IPlus = (p) => (
  <S {...p}>
    <rect x="8.5" y="3" width="3" height="14" />
    <rect x="3" y="8.5" width="14" height="3" />
  </S>
);

export const IChevron = (p) => (
  <S {...p}>
    <path d="M7 4h3l6 6-6 6H7l6-6z" />
  </S>
);

export const ICheck = (p) => (
  <S {...p}>
    <path d="M3 10.5 5.2 8.3 8.2 11.3 14.8 4.7 17 6.9 8.2 15.7z" />
  </S>
);

export const IClose = (p) => (
  <S {...p}>
    <path d="M4.2 2 10 7.8 15.8 2 18 4.2 12.2 10 18 15.8 15.8 18 10 12.2 4.2 18 2 15.8 7.8 10 2 4.2z" />
  </S>
);

export const IPlay = (p) => (
  <S {...p}>
    <path d="M5 3l12 7-12 7z" />
  </S>
);

export const ITrash = (p) => (
  <S {...p}>
    <rect x="3" y="3" width="14" height="2.5" />
    <rect x="7.5" y="1" width="5" height="2" />
    <path d="M4.5 7h11l-1 11h-9z" />
  </S>
);

export const IBolt = (p) => (
  <S {...p}>
    <path d="M11 1 3 11h5l-1 8 8-10h-5z" />
  </S>
);

export const IDots = (p) => (
  <S {...p}>
    <rect x="2" y="8.5" width="3" height="3" />
    <rect x="8.5" y="8.5" width="3" height="3" />
    <rect x="15" y="8.5" width="3" height="3" />
  </S>
);
