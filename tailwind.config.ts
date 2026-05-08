import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F5EFE6',
        'cream-dark': '#EBE3D5',
        sage: '#7C9082',
        'sage-dark': '#5C6E62',
        terracotta: '#C47A5A',
        'terracotta-light': '#F0D5C3',
        charcoal: '#2D2D2D',
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
