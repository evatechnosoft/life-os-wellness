const paths = {
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.5" /></>,
  dumbbell: <path d="M6 7v10M18 7v10M2 10v4M22 10v4M6 12h12" strokeLinecap="round" />,
  plate: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></>,
  blender: <path d="M7 3h10l-1 9a4 4 0 01-4 4h0a4 4 0 01-4-4L7 3zM7 20h10M9 3v4M15 3v4" strokeLinecap="round" strokeLinejoin="round" />,
  bell: <path d="M12 3a5 5 0 00-5 5v3.5l-1.5 3h13L17 11.5V8a5 5 0 00-5-5zM9.5 19a2.5 2.5 0 005 0" strokeLinecap="round" strokeLinejoin="round" />,
  watch: <><circle cx="12" cy="12" r="6" /><path d="M9 3h6M9 21h6M12 9v3l2 2" strokeLinecap="round" strokeLinejoin="round" /></>,
  export: <path d="M12 3v12m0-12l-4 4m4-4l4 4M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4" strokeLinecap="round" strokeLinejoin="round" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" /></>,
  chevron: <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />,
}

export default function Icon({ name, className = 'w-5 h-5', strokeWidth = 1.7 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className}>
      {paths[name] || null}
    </svg>
  )
}
