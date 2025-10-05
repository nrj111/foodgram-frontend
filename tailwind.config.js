/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // matches previous data-theme based switching; add/remove 'dark' class manually
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#ff6a3d',
          hover: '#ff8540'
        },
        surface: 'var(--color-surface, #1d1d1f)',
        'surface-alt': 'var(--color-surface-alt, #262628)',
        border: 'var(--color-border, #2f2f31)'
      },
      boxShadow: {
        card: '0 8px 24px -6px rgba(0,0,0,.35)'
      },
      keyframes: {
        'like-pop': { '0%': { transform: 'scale(.55)' }, '40%': { transform: 'scale(1.25)' }, '70%': { transform: 'scale(.92)' }, '100%': { transform: 'scale(1)' } }
      },
      animation: {
        'like-pop': 'like-pop .5s cubic-bezier(.25,.85,.35,1.2)'
      }
    }
  },
  plugins: []
}
