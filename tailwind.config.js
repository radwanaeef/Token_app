/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        clinic: {
          bg: '#EAF4F1',
          teal: '#0F5C5C',
          tealDark: '#0A3F3F',
          coral: '#E8734A',
          amber: '#C98A2C',
          ink: '#1F2A2E',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        token: '50%',
      },
    },
  },
  plugins: [],
};
