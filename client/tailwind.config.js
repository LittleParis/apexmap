/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00f0ff',
        'neon-magenta': '#ff00e5',
        'neon-yellow': '#f0ff00',
        'neon-orange': '#ff6a00',
        'neon-red': '#ff003c',
        'neon-green': '#00ff88',
        'bg-primary': 'var(--bg-primary)',
        'bg-card': 'var(--bg-card)',
        'bg-card-hover': 'var(--bg-card-hover)',
      },
      fontFamily: {
        'display': ['Orbitron', 'Rajdhani', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
        'body': ['Inter', '"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
        'urgent-blink': 'urgentBlink 0.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-line': 'glowLine 3s ease-in-out infinite',
      },
      keyframes: {
        neonPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        urgentBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowLine: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
