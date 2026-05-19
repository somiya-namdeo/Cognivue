/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#020208',
        cardBg: 'rgba(8, 8, 20, 0.45)',
        panelBg: 'rgba(10, 10, 28, 0.75)',
        glowCyan: '#06b6d4',
        glowViolet: '#8b5cf6',
        glowIndigo: '#6366f1',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out infinite 2s',
        'glow-pulse': 'glowPulse 3s infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-10px) scale(1.01)' },
        },
        glowPulse: {
          '0%': { boxShadow: '0 0 10px rgba(6, 182, 212, 0.1), 0 0 5px rgba(139, 92, 246, 0.05)' },
          '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.25), 0 0 10px rgba(139, 92, 246, 0.15)' },
        },
      },
    },
  },
  plugins: [],
}
