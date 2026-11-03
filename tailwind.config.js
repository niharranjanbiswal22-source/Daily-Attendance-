/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // BizHR / Strongmate emerald primary
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b'
        },
        dark: {
          bg: '#0a0a0c',
          card: '#121215',
          cardHover: '#18181d',
          border: '#27272e',
          text: '#f3f4f6',
          muted: '#9ca3af'
        }
      }
    },
  },
  plugins: [],
}
