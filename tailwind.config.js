/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tokens matching the Admin Console build (/dist/tailwind.css)
        tesla: {
          DEFAULT: '#0f172a',
          600: '#1e293b',
          700: '#020617',
        },
        success: {
          DEFAULT: '#10b981',
          bg: '#d1fae5',
        },
        danger: '#ef4444',
        purple: '#8b5cf6',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
