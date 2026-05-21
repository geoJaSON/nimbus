/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        phosphor: '#00ff41',
        'phosphor-dim': '#00b32c',
        'phosphor-dark': '#003a0f',
        'phosphor-glow': '#33ff66',
        terminal: '#000000',
        'terminal-surface': '#080808',
        'terminal-border': '#1a4a1a',
        'terminal-border-dim': '#0d2a0d',
        amber: '#ffb000',
        'amber-dim': '#c87800',
        'warn-tornado': '#ff0000',
        'warn-svr': '#ff8800',
        'warn-watch': '#ff6600',
        'warn-flood': '#00ff00',
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', '"Courier New"', 'Courier', 'monospace'],
      },
      boxShadow: {
        phosphor: '0 0 8px rgba(0,255,65,0.4)',
        'phosphor-sm': '0 0 4px rgba(0,255,65,0.3)',
        amber: '0 0 8px rgba(255,176,0,0.4)',
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        scanline: 'scanline 8s linear infinite',
        'pulse-warn': 'pulse-warn 1.5s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'pulse-warn': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 8px rgba(255,0,0,0.6)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 16px rgba(255,0,0,1)' },
        },
      },
    },
  },
  plugins: [],
};
