import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#f9d0d9',
          300: '#f4a9ba',
          400: '#ed7896',
          500: '#e04d75',
          600: '#cc2d5a',
          700: '#ab2149',
          800: '#8f1f41',
          900: '#7a1d3b',
          950: '#440b1d',
        },
        gold: {
          50: '#fefdf7',
          100: '#fdfaeb',
          200: '#faf3cc',
          300: '#f5e8a3',
          400: '#edd86f',
          500: '#e3c446',
          600: '#cba32e',
          700: '#a97d26',
          800: '#8a6326',
          900: '#725223',
          950: '#422c10',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
