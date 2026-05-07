import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        sage: '#7C9082',
        'sage-dark': '#5C6E62',
        terracotta: '#D4845A',
        'terracotta-light': '#F0D5C3',
        charcoal: '#2D2D2D',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
