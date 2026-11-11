/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)', paper: 'rgb(var(--paper) / <alpha-value>)', ink: 'rgb(var(--ink) / <alpha-value>)', terra: 'rgb(var(--terra) / <alpha-value>)', teal: 'rgb(var(--teal) / <alpha-value>)', olive: 'rgb(var(--olive) / <alpha-value>)', mustard: 'rgb(var(--mustard) / <alpha-value>)',
        pop: { bg: 'rgb(var(--pop-bg) / <alpha-value>)', ink: 'rgb(var(--pop-ink) / <alpha-value>)', fill: 'rgb(var(--pop-fill) / <alpha-value>)', onfill: 'rgb(var(--pop-onfill) / <alpha-value>)', tile: 'rgb(var(--pop-tile) / <alpha-value>)', lime: 'rgb(var(--pop-lime) / <alpha-value>)', coral: 'rgb(var(--pop-coral) / <alpha-value>)', cobalt: 'rgb(var(--pop-cobalt) / <alpha-value>)', peach: 'rgb(var(--pop-peach) / <alpha-value>)' },
      },
      fontFamily: {
        fraunces: ['Fraunces', 'serif'],
        isans: ['"Instrument Sans"', 'sans-serif'],
        flex: ['"Roboto Flex"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
