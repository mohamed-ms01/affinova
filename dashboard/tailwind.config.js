/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0b0f14',
          sidebar: '#0e131a',
          card: '#141b24',
          elevated: '#1a222f',
          input: '#0e131a',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(255, 255, 255, 0.16)'
        },
        light: {
          bg: '#f8fafc',
          sidebar: '#ffffff',
          card: '#ffffff',
          elevated: '#f1f5f9',
          input: '#f8fafc',
          border: 'rgba(15, 23, 42, 0.08)',
          borderHover: 'rgba(15, 23, 42, 0.16)'
        },
        affinova: {
          teal: '#2ee6a6',
          'teal-hover': '#3df0b3',
          'teal-glow': 'rgba(46, 230, 166, 0.22)',
          violet: '#7c8cff',
          'violet-hover': '#8f9dff',
          'violet-glow': 'rgba(124, 140, 255, 0.22)',
          gold: '#ffb020',
          danger: '#ff5c77',
          cyan: '#00f2fe'
        }
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: {
        'pill': '28px',
        'card': '18px'
      },
      boxShadow: {
        'glow-teal': '0 0 25px rgba(46, 230, 166, 0.2)',
        'glow-violet': '0 0 25px rgba(124, 140, 255, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
