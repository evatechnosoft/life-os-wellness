/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        k0: '#0E0F10',
        k1: '#17181A',
        k2: '#1F2023',
        k3: '#2A2B2F',
        kl: '#3A3B40',
        kt: '#E8E8E6',
        km: '#8A8C90',
        ko: '#FF5A1F',
        kod: '#D9461A',
        kg: '#3DDC97',
        // D2 · Toprak Gecesi
        tg0: '#14110F',
        tgx: '#1D1916',
        tg1: '#2A2420',
        tg2: '#3A322C',
        tgt: '#EDE6DC',
        tgm: '#A8998A',
        tga: '#D9A066',
        tgad: '#B9834D',
        tgs: '#7FA88A',
        tgr: '#C4553A',
        tgrl: '#E07F66',
      },
      fontFamily: {
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        plex: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
