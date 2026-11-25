/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        temple: {
          dark: '#0c0e14',
          panel: '#151922',
          surface: '#1b202c',
          border: '#2a3245',
          teal: '#0d9488',
          tealDark: '#0f3844',
          gold: '#f59e0b',
          goldLight: '#fbbf24',
          amber: '#d97706',
          ruby: '#f43f5e',
          accent: '#10b981',
          obsidian: '#090a0f',
        }
      },
      gridTemplateColumns: {
        '15': 'repeat(15, minmax(0, 1fr))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        temple: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-teal': '0 0 25px rgba(13, 148, 136, 0.45)',
        'glow-gold': '0 0 25px rgba(245, 158, 11, 0.5)',
        'glow-amber': '0 0 35px rgba(217, 119, 6, 0.6)',
      }
    },
  },
  plugins: [],
}
