import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        lavender: '#E6E6FA',
        violet: '#6F67D9',
        ink: '#2D2D3A',
      },
      boxShadow: {
        soft: '0 16px 44px rgba(49, 43, 92, .08)',
        card: '0 12px 32px rgba(49, 43, 92, .10)',
      },
      borderRadius: { '4xl': '2rem' },
      transitionDuration: { 180: '180ms' },
    },
  },
  plugins: [],
};

export default config;
