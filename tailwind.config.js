/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Light foundation */
        white: '#FFFFFF',
        snow: '#FAFAFA',
        mist: '#F5F5F5',
        silver: '#E5E5E5',
        
        /* Dark accents */
        graphite: '#404040',
        charcoal: '#262626',
        ink: '#171717',
        black: '#0A0A0A',
        
        /* Torch/flame warmth */
        ember: '#F59E0B',
        flame: '#D97706',
        glow: '#FEF3C7',
        warmth: '#FFFBEB',
        
        /* Neutrals */
        stone: '#A3A3A3',
        ash: '#737373',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(2.5rem, 8vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'headline': ['clamp(1.75rem, 5vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionDuration: {
        '400': '400ms',
      },
      animation: {
        'flicker': 'flicker 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
