/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vyapar: {
          sidebar: '#f1f5f9',
          hover: '#e2e8f0',
          primary: '#ef4444',
          text: '#1e293b',
          subtext: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Helvetica', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'Garamond', 'serif'],
        body: ['Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
