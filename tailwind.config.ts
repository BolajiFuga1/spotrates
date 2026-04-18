import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#143061',
          orange: '#e86e25',
        },
      },
    },
  },
  plugins: [],
} satisfies Config

