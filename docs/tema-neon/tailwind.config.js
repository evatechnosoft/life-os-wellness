/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        g: {
          bg: '#0A0A0A',
          soft: '#131313',
          paper: '#F4F4F0',
          ink: '#F4F4F0',
          dim: 'rgba(244,244,240,.74)',
          edge: 'rgba(255,255,255,.14)',
          lime: '#C6FF3D',
          pink: '#FF2D9B',
          cyan: '#17E1F2',
        },
        p: {
          paper: '#F4F4F0',
          sheet: '#E9E8E1',
          ink: '#0A0A0A',
          dim: 'rgba(10,10,10,.70)',
          lime: '#C6FF3D',
          pink: '#FF2D9B',
          cyan: '#17E1F2',
        },
      },
      fontFamily: {
        bangers: ['Bangers', 'Impact', 'sans-serif'],
        anybody: ['Anybody', 'Inter', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
