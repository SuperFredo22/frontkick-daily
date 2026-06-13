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
        'bg-2': 'var(--bg-2)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
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
        violet: 'var(--violet)',
        'violet-soft': 'var(--violet-soft)',
        green: 'var(--green)',
        'green-soft': 'var(--green-soft)',

        /* Inverted gray scale — maps Tailwind's light-mode grays onto the
           dark theme. Low numbers = dark surfaces, high numbers = bright text.
           Lets the legacy text-gray-* / bg-gray-* / border-gray-* classes
           render correctly on dark without per-line edits. */
        gray: {
          50:  '#16161C',
          100: '#1C1C25',
          200: '#2A2A34',
          300: '#6A6A78',
          400: '#83838F',
          500: '#A6A6B5',
          600: '#BFBFCB',
          700: '#D8D8E0',
          800: '#ECECF1',
          900: '#F5F5F8',
        },

        /* Legacy aliases */
        'red-kick': 'var(--red)',
        'cyan-fight': 'var(--cyan)',
        'orange-marque': 'var(--orange)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      backgroundImage: {
        'grad-fire': 'var(--grad-fire)',
        'grad-rank': 'var(--grad-rank)',
        'grad-focus': 'var(--grad-focus)',
        'grad-xp': 'var(--grad-xp)',
        'grad-surface': 'var(--grad-surface)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        fab: 'var(--shadow-fab)',
        'glow-red': 'var(--glow-red)',
        'glow-violet': 'var(--glow-violet)',
        'glow-orange': 'var(--glow-orange)',
        'card-hover': 'var(--shadow-lift)',
      },
    },
  },
  plugins: [],
}
