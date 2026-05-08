import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F2EDE4',
        'cream-dark': '#E6DFD4',
        sage: '#8A9A8D',
        'sage-dark': '#6B7D6F',
        terracotta: '#C4947A',
        'terracotta-light': '#F0DED2',
        charcoal: '#4A4038',
        warm: '#3D3226',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'Cambria', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
