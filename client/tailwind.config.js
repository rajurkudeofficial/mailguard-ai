/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#040810',
          900: '#0a0e1a',
          800: '#0f1628',
          700: '#141d35',
          600: '#1a2540',
        },
        cyber: {
          DEFAULT: '#00d4ff',
          dim: '#00a3c4',
          glow: 'rgba(0, 212, 255, 0.2)',
        },
        purple: {
          DEFAULT: '#7c3aed',
          dim: '#6d28d9',
          glow: 'rgba(124, 58, 237, 0.2)',
        },
        threat: {
          safe: '#10b981',
          low: '#34d399',
          medium: '#f59e0b',
          high: '#ef4444',
          critical: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'cyber': '0 0 20px rgba(0, 212, 255, 0.15)',
        'cyber-lg': '0 0 40px rgba(0, 212, 255, 0.25)',
        'purple': '0 0 20px rgba(124, 58, 237, 0.2)',
        'threat': '0 0 20px rgba(220, 38, 38, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        'hero-gradient': 'radial-gradient(ellipse at top left, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(0,212,255,0.1) 0%, transparent 60%)',
      },
      animation: {
        'pulse-cyber': 'pulse-cyber 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      keyframes: {
        'pulse-cyber': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 212, 255, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 212, 255, 0)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
