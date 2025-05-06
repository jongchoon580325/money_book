/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#17195c',
        secondary: '#232882',
        accent: '#1d2170',
      },
      backgroundColor: {
        'gray-850': '#1f2937',
      },
    },
  },
  plugins: [],
} 