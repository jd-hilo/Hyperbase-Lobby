import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    borderRadius: {
      none: '0',
      DEFAULT: '0',
      sm: '0',
      md: '0',
      lg: '0',
      full: '9999px',
    },
    extend: {
      colors: {
        void: '#000000',
        signal: '#FFFFFF',
        conduit: '#1A1A1A',
        lattice: '#3F4654',
        trace: '#A8B2C2',
        rail: '#CFD5E0',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'SF Mono', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      borderColor: { DEFAULT: '#3F4654' },
      borderWidth: { DEFAULT: '1.5px' },
    },
  },
  plugins: [],
}

export default config
