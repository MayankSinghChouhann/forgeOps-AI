import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0E14',
        panel: '#151922',
        border: '#232838',
        primary: '#E6E8EB',
        secondary: '#8B93A7',
        accent: '#F5A623',
        success: '#3FB950',
        error: '#F85149',
        info: '#58A6FF',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
