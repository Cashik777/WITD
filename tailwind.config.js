/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        black: '#0B0B0A',
        paper: '#F4F2EC',
        ink: '#151412',
        mist: '#8F8B82',
        line: '#26251F',
        'line-light': '#DEDBD1',
        accent: '#2E3B2F',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Space Grotesk"', 'sans-serif'],
      },
      letterSpacing: {
        widest: '.18em',
      },
      maxWidth: {
        content: '1440px',
      },
      transitionTimingFunction: {
        witd: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
