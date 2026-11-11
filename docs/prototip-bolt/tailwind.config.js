/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0d12',
        glass: 'rgba(255,255,255,.06)',
        glassBorder: 'rgba(255,255,255,.07)',
        teal: '#2dd4bf',
        indigo: '#6366f1',
        pink: '#ec4899',
        good: '#4ade80',
        bad: '#f87171',
      },
      borderRadius: {
        glass: '18px',
      },
      spacing: {
        '4.5': '1.125rem',
      },
    },
  },
  plugins: [],
}
