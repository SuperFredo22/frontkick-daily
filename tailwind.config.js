/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        line: 'var(--line)',
        'line-2': 'var(--line-2)',
        red: 'var(--red)',
        'red-soft': 'var(--red-soft)',
        'red-50': 'var(--red-50)',
        cyan: 'var(--cyan)',
        'cyan-soft': 'var(--cyan-soft)',
        orange: 'var(--orange)',
        'orange-soft': 'var(--orange-soft)',
        green: 'var(--green)',
        'green-soft': 'var(--green-soft)',
        /* Legacy aliases kept for backward compat */
        'red-kick': '#C0392B',
        'cyan-fight': '#00B4D8',
        'orange-marque': '#E67E22',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        fab: 'var(--shadow-fab)',
        /* Legacy */
        'card-hover': '0 4px 16px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
