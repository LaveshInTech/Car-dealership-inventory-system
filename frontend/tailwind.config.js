/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c2d9ea',
          300: '#94bedb',
          400: '#5e9dc8',
          500: '#3882b2',
          600: '#286794',
          700: '#225377',
          800: '#1e4663',
          900: '#0f172a', // Premium deep navy
          950: '#090d16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
