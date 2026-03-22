/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        score: {
          excellent: '#16a34a',
          good: '#65a30d',
          average: '#ca8a04',
          poor: '#dc2626',
        },
      },
    },
  },
  plugins: [],
};
