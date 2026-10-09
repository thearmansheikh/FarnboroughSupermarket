/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.html', './public/**/*.js'],
  theme: {
    extend: {
      boxShadow: { soft: '0 18px 38px rgba(22, 90, 53, 0.12)' },
      colors: {
        brand: {
          50: '#edf8f0',
          100: '#dfeee4',
          200: '#c3e0cd',
          500: '#165a35',
          600: '#124d2e',
          700: '#0d3b22',
          800: '#102b22',
        },
        gold: '#f4c767',
      },
    },
  },
};
