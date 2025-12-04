/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mint': '#77D1C4',
        'mint-dark': '#63b8ac',
        'dark-gray': '#333333',
        'chronic-bg': '#FFF7EE',
        'simple-bg': '#F3F8FF',
        'alert-bg': '#FEEFEF',
        'alert-icon': '#E74C3C',
        'prescription': '#4A90E2',
        'supplement': '#47B881',
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
      boxShadow: {
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'popup': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}