/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Kinfolk/Myora - warm, muted, serene */
        cream: '#FAF8F5',
        linen: '#F5F1EC',
        sand: '#E8E2D9',
        stone: '#D4CCC2',
        driftwood: '#B8AFA3',
        charcoal: '#4A4642',
        ink: '#2D2B28',
        
        /* Muted sage accent - calming, natural */
        sage: {
          DEFAULT: '#8B9A7E',
          light: '#A8B59C',
          dark: '#6B7A60',
        },
        
        /* Warm terracotta as secondary */
        terracotta: {
          DEFAULT: '#A0574B',
          light: '#C17B68',
        },
        
        /* Legacy support */
        'warm-sand': '#E8E2D9',
        'warm-charcoal': '#4A4642',
        'warm-gray': '#B8AFA3',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      transitionTimingFunction: {
        'kinfolk': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Crimson Text', 'Georgia', 'serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
