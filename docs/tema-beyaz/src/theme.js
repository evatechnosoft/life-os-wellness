// Single palette source: Tailwind reads the CSS vars, SVG/inline styles read `c`. Mode is fixed per page load (?mode=dark).
const PALETTE = {
  light: {
    canvas: '#E4E1DA', paper: '#F0EEE9', ink: '#1C1A17', terra: '#E85D3F', teal: '#1F5C63', olive: '#5F6F52', mustard: '#E9C46A',
    'pop-bg': '#FFFBF2', 'pop-ink': '#121212', 'pop-fill': '#121212', 'pop-onfill': '#FFFBF2', 'pop-tile': '#FFFFFF',
    'pop-lime': '#C6F432', 'pop-coral': '#FF6B4A', 'pop-cobalt': '#3A2E8F', 'pop-peach': '#FFD9CC', 'pop-off': '#D9D6CE',
  },
  dark: {
    canvas: '#0F0D0B', paper: '#1A1714', ink: '#F0EEE9', terra: '#F0714F', teal: '#5FA3AB', olive: '#9AAA8A', mustard: '#E9C46A',
    'pop-bg': '#121212', 'pop-ink': '#FFFBF2', 'pop-fill': '#2A2A2A', 'pop-onfill': '#FFFBF2', 'pop-tile': '#1E1E1E',
    'pop-lime': '#C6F432', 'pop-coral': '#FF6B4A', 'pop-cobalt': '#7B6CF0', 'pop-peach': '#3A2622', 'pop-off': '#3A3A3A',
  },
};

export const mode = new URLSearchParams(location.search).get('mode') === 'dark' ? 'dark' : 'light';
export const c = PALETTE[mode];

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');
const root = document.documentElement;
root.classList.toggle('dark', mode === 'dark');
for (const [k, v] of Object.entries(c)) root.style.setProperty(`--${k}`, channels(v));
