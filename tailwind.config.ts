import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#fbfbf4',
        'cream-dark': '#e8e6d4',
        sage: '#79852c',
        'sage-dark': '#5e6a22',
        terracotta: '#c4947a',
        'terracotta-light': '#ebd5c5',
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
