import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF5FA3',
        blush: '#FFF7F9',
        roseSoft: '#FFB3C1',
      },
      boxShadow: {
        card: '0 4px 16px rgba(255, 95, 163, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
