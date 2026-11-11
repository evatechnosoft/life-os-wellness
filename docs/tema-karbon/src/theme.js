// Single palette source: Tailwind reads the CSS vars, SVG/inline styles read `c`. Mode is fixed per page load (?mode=light).
const ON = { kon: '#0E0F10', tgon: '#14110F' }; // text on bright accent fills stays dark in both modes
const PALETTE = {
  dark: {
    ...ON, canvas: '#0B0B0C',
    k0: '#0E0F10', k1: '#17181A', k2: '#1F2023', k3: '#2A2B2F', kl: '#3A3B40', kt: '#E8E8E6', km: '#8A8C90', ko: '#FF5A1F', kod: '#D9461A', kg: '#3DDC97',
    tg0: '#14110F', tgx: '#1D1916', tg1: '#2A2420', tg2: '#3A322C', tgt: '#EDE6DC', tgm: '#A8998A', tga: '#D9A066', tgad: '#B9834D', tgs: '#7FA88A', tgr: '#C4553A', tgrl: '#E07F66',
  },
  light: {
    ...ON, canvas: '#E6E6E3',
    k0: '#F4F4F2', k1: '#FFFFFF', k2: '#EBEBE8', k3: '#DCDCD8', kl: '#C8C8C3', kt: '#121314', km: '#5E6166', ko: '#E8480C', kod: '#C23B08', kg: '#12A26A',
    tg0: '#F6F0E7', tgx: '#F0E8DC', tg1: '#EDE3D4', tg2: '#E2D5C2', tgt: '#2A2420', tgm: '#75685B', tga: '#B9772F', tgad: '#9A6224', tgs: '#4F7A5C', tgr: '#A8432C', tgrl: '#C4553A',
  },
};

export const mode = new URLSearchParams(location.search).get('mode') === 'light' ? 'light' : 'dark';
export const c = PALETTE[mode];

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');
const root = document.documentElement;
root.classList.toggle('light', mode === 'light');
for (const [k, v] of Object.entries(c)) root.style.setProperty(`--${k}`, channels(v));
