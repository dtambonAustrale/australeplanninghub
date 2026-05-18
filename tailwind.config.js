/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0d6efd',
          success: '#198754',
          danger: '#dc3545',
          warning: '#f59f00',
          sidebar: '#071525',
          bg: '#f4f7fb',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(13,110,253,0.07)',
        'card-hover': '0 6px 24px 0 rgba(13,110,253,0.13)',
      },
    },
  },
  plugins: [],
};
