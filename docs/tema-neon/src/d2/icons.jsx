// Neon Afiş icons: geometric cut-paper blocks, square joins, heavy 3px ink.
const b = { width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinejoin: 'miter', strokeLinecap: 'square' };

export const PBugun = (p) => (
  <svg {...b} {...p}>
    <circle cx="12" cy="12" r="5" fill="currentColor" />
    <path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2 2M17.8 17.8l2 2M4.2 19.8l2-2M17.8 6.2l2-2" />
  </svg>
);

export const PPlan = (p) => (
  <svg {...b} {...p}>
    <path d="M3 5h18v16H3z" />
    <path d="M3 10h18" />
    <path d="M6 13h4v4H6z" fill="currentColor" />
  </svg>
);

export const POlcum = (p) => (
  <svg {...b} {...p}>
    <path d="M2 8h20v8H2z" />
    <path d="M6 8v4M10 8v5M14 8v4M18 8v5" strokeWidth="2.4" />
  </svg>
);

export const PKoc = (p) => (
  <svg {...b} {...p}>
    <path d="M3 3h18v13H11l-5 5v-5H3z" />
    <path d="M8 9.5h8" />
  </svg>
);

export const PPlus = (p) => (
  <svg {...b} strokeWidth="4" {...p}>
    <path d="M12 3v18M3 12h18" />
  </svg>
);

export const PCheck = (p) => (
  <svg {...b} strokeWidth="3.6" {...p}>
    <path d="m3 12 6 6L21 6" />
  </svg>
);

export const PArrow = (p) => (
  <svg {...b} {...p}>
    <path d="M2 12h18M13 5l7 7-7 7" />
  </svg>
);

export const PTrash = (p) => (
  <svg {...b} {...p}>
    <path d="M2 6h20M9 6V2h6v4M5 6l1 16h12l1-16" />
    <path d="M12 10v8" />
  </svg>
);

export const PGear = (p) => (
  <svg {...b} {...p}>
    <path d="M12 1v4M12 19v4M1 12h4M19 12h4M4.2 4.2 7 7M17 17l2.8 2.8M4.2 19.8 7 17M17 7l2.8-2.8" />
    <path d="M7 7h10v10H7z" fill="currentColor" />
  </svg>
);

export const PTarget = (p) => (
  <svg {...b} {...p}>
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="12" r="4" fill="currentColor" />
  </svg>
);

export const PBook = (p) => (
  <svg {...b} {...p}>
    <path d="M3 3h7v18H3zM10 3h4v18h-4zM15 4l4.5-1 3 17-4.5 1z" />
  </svg>
);

export const PPlate = (p) => (
  <svg {...b} {...p}>
    <circle cx="12" cy="13" r="8" />
    <circle cx="12" cy="13" r="3.5" fill="currentColor" />
    <path d="M12 1v3" />
  </svg>
);

export const PCup = (p) => (
  <svg {...b} {...p}>
    <path d="M5 7h14l-2 15H7z" />
    <path d="M4 7h16M14 7l2-6" />
  </svg>
);

export const PBell = (p) => (
  <svg {...b} {...p}>
    <path d="M5 18V10a7 7 0 0 1 14 0v8zM2 18h20" />
    <path d="M10 21h4" />
  </svg>
);

export const PWatch = (p) => (
  <svg {...b} {...p}>
    <path d="M6 6h12v12H6z" />
    <path d="M9 1h6v5M9 23h6v-5M12 9v3h2" />
  </svg>
);

export const PExport = (p) => (
  <svg {...b} {...p}>
    <path d="M12 15V2M6 8l6-6 6 6M3 13v9h18v-9" />
  </svg>
);

export const PBolt = (p) => (
  <svg {...b} strokeWidth="2.6" {...p}>
    <path d="M14 1 4 14h7l-2 9 11-14h-7z" fill="currentColor" />
  </svg>
);
