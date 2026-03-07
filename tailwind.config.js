/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Warm off-white foundation */
        cream: '#F5F2ED',
        linen: '#FAF8F5',
        paper: '#FFFDF9',
        
        /* Charcoal/neutral accents */
        charcoal: '#2C2C2C',
        graphite: '#404040',
        ash: '#5C5650',
        stone: '#8A8A8A',
        silver: '#D4D4D4',
        
        /* Black and white */
        ink: '#1A1A1A',
        black: '#000000',
        white: '#FFFFFF',
        beam: '#FFFEF8',
      },
      fontFamily: {
        serif: ['EB Garamond', 'Georgia', 'serif'],
        sans: ['Nunito Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(2.5rem, 8vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'headline': ['clamp(1.75rem, 5vw, 2.25rem)', { lineHeight: '1.2' }],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
