/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F0EEE9',
        ink: '#1C1A17',
        terra: '#E85D3F',
        teal: '#1F5C63',
        olive: '#5F6F52',
        mustard: '#E9C46A',
        pop: {
          bg: '#FFFBF2',
          ink: '#121212',
          lime: '#C6F432',
          coral: '#FF6B4A',
          cobalt: '#3A2E8F',
          peach: '#FFD9CC',
        },
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
