/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        terracotta: '#A0574B',
        'warm-sand': '#E8DCC4',
        'warm-charcoal': '#3D3935',
        'warm-gray': '#ADA8A0',
      },
      transitionDuration: {
        '600': '600ms',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Crimson Text', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
