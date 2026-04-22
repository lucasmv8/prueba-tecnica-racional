import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#edfaf6',
          100: '#d0f5e8',
          200: '#a3ead4',
          300: '#7de0c0',
          400: '#65d6b0',
          500: '#4fc3a1',
          600: '#3aac8d',
          700: '#2d8f75',
          800: '#22705c',
          900: '#1a5a4a',
          950: '#0e3530',
        },
        accent: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:      '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-lg': '0 4px 16px -2px rgba(0,0,0,0.10), 0 2px 6px -2px rgba(0,0,0,0.07)',
        modal:     '0 24px 64px -12px rgba(0,0,0,0.20), 0 8px 24px -4px rgba(0,0,0,0.13)',
      },
    },
  },
  plugins: [],
} satisfies Config
