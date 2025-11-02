/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cricket: {
          green: '#2d5016',
          lightgreen: '#4a7c2c',
          gold: '#ffd700',
        },
      },
    },
  },
  plugins: [],
}
