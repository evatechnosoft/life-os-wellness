// Custom chunky, filled "stencil" icons for Graffiti Sokak — not a thin outline set.
const base = { width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true };

export const IcBugun = (p) => (
  <svg {...base} {...p}>
    <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="currentColor" />
    <rect x="10" y="15" width="4" height="6" fill="#0A0A0A" />
  </svg>
);

export const IcPlan = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="17" rx="2" fill="currentColor" />
    <rect x="3" y="4" width="18" height="5" fill="currentColor" opacity=".55" />
    <path d="M7 2v4M17 2v4" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
    <path d="m7.5 14.5 3 3 6-6" stroke="#0A0A0A" strokeWidth="2.8" fill="none" strokeLinecap="square" />
  </svg>
);

export const IcOlcum = (p) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="4" width="19" height="16" rx="3" fill="currentColor" />
    <path d="M7 13a5 5 0 0 1 10 0" stroke="#0A0A0A" strokeWidth="2.6" fill="none" />
    <path d="m12 13 2.6-3" stroke="#0A0A0A" strokeWidth="2.6" strokeLinecap="square" />
  </svg>
);

export const IcKoc = (p) => (
  <svg {...base} {...p}>
    <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10l-5 4v-4a2 2 0 0 1-2-2z" fill="currentColor" />
    <path d="M13 6 9 11h3l-1 4 4-5h-3z" fill="#0A0A0A" />
  </svg>
);

export const IcPlus = (p) => (
  <svg {...base} {...p}>
    <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" fill="currentColor" />
  </svg>
);

export const IcCheck = (p) => (
  <svg {...base} {...p}>
    <path d="m3 12.5 3-3 4 4 8-8 3 3-11 11z" fill="currentColor" />
  </svg>
);

export const IcArrow = (p) => (
  <svg {...base} {...p}>
    <path d="M4 10h10l-4-4 3-3 9 9-9 9-3-3 4-4H4z" fill="currentColor" />
  </svg>
);

export const IcBolt = (p) => (
  <svg {...base} {...p}>
    <path d="M14 2 4 14h6l-2 8 11-13h-7z" fill="currentColor" />
  </svg>
);

export const IcTrash = (p) => (
  <svg {...base} {...p}>
    <path d="M8 2h8v3h5v3H3V5h5z" fill="currentColor" />
    <path d="M5 9h14l-1.2 13H6.2z" fill="currentColor" />
    <path d="M10 12v7M14 12v7" stroke="#0A0A0A" strokeWidth="2" />
  </svg>
);

export const IcFlame = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="currentColor" />
  </svg>
);

export const IcMoon = (p) => (
  <svg {...base} {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" fill="currentColor" />
  </svg>
);

export const IcHeart = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21 3.5 12.5A5 5 0 0 1 12 6a5 5 0 0 1 8.5 6.5z" fill="currentColor" />
    <path d="M5 13h4l1.5-3 3 6 1.5-3h4" stroke="#0A0A0A" strokeWidth="2" fill="none" />
  </svg>
);

export const IcShoe = (p) => (
  <svg {...base} {...p}>
    <path d="M2 17V9l5-1 2 3 4 1 6 1.5a3 3 0 0 1 3 3V17z" fill="currentColor" />
    <rect x="2" y="18" width="20" height="3" fill="currentColor" opacity=".5" />
  </svg>
);

export const IcGear = (p) => (
  <svg {...base} {...p}>
    <path d="M10 2h4l.6 2.6 2.2 1 2.3-1.4 2.8 2.8-1.4 2.3 1 2.2L24 12v0l-2.5.6-1 2.2 1.4 2.3-2.8 2.8-2.3-1.4-2.2 1L14 22h-4l-.6-2.5-2.2-1-2.3 1.4-2.8-2.8 1.4-2.3-1-2.2L0 12l2.5-.6 1-2.2-1.4-2.3 2.8-2.8 2.3 1.4 2.2-1z" fill="currentColor" transform="scale(.92) translate(1 1)" />
    <circle cx="12" cy="12" r="3.4" fill="#0A0A0A" />
  </svg>
);

export const IcStar = (p) => (
  <svg {...base} {...p}>
    <path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6z" fill="currentColor" />
  </svg>
);
