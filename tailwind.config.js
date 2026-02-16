/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        petrol: {
          50: '#e0f2f4',
          100: '#b3dfe3',
          200: '#80cad0',
          300: '#4db5bd',
          400: '#26a5ae',
          500: '#005f73', // Primary brand color
          600: '#004d5c',
          700: '#003d47',
          800: '#002d35',
          900: '#001f26',
        },
        mustard: {
          50: '#fef8e7',
          100: '#fceec4',
          200: '#fae29c',
          300: '#f8d674',
          400: '#f6cd57',
          500: '#e8aa42', // Secondary accent
          600: '#d69736',
          700: '#c3842a',
          800: '#b0711e',
          900: '#9d5e12',
        },
        aurora: {
          glass: 'rgba(255, 255, 255, 0.98)',
          'glass-hover': 'rgba(255, 255, 255, 1)',
          border: 'rgba(0, 95, 115, 0.08)',
          'border-hover': 'rgba(0, 95, 115, 0.16)',
        },
      },
      backdropBlur: {
        glass: '20px',
        'glass-strong': '24px',
      },
      backgroundImage: {
        'aurora-gradient': 'linear-gradient(135deg, #005f73 0%, #0a9396 100%)',
        'aurora-gradient-soft': 'radial-gradient(ellipse 120% 100% at 50% 0%, rgba(148, 210, 189, 0.15), transparent 70%), radial-gradient(ellipse 80% 80% at 20% 50%, rgba(0, 95, 115, 0.08), transparent 60%)',
        'dark-gradient': 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.1)',
        'large': '0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
