/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        alabaster: '#F8FAFC',
        sky: {
          light: '#38BDF8',
          DEFAULT: '#0EA5E9',
          dark: '#0284C7',
        },
        mint: {
          light: '#34D399',
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        amber: {
          light: '#FBBF24',
          DEFAULT: '#F59E0B',
          dark: '#D97706',
        },
        coral: {
          light: '#FB7185',
          DEFAULT: '#F43F5E',
          dark: '#E11D48',
        },
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(14, 165, 233, 0.08)',
        'glass-hover': '0 16px 40px 0 rgba(14, 165, 233, 0.16)',
        'glass-mint': '0 12px 36px 0 rgba(16, 185, 129, 0.18)',
        'glass-amber': '0 12px 36px 0 rgba(245, 158, 11, 0.18)',
        'glass-coral': '0 12px 36px 0 rgba(244, 63, 94, 0.22)',
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
