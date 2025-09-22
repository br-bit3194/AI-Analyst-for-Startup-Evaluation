/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        brand: {
          DEFAULT: '#4F46E5',  // Indigo-600
          light: '#6366F1',    // Indigo-500
          dark: '#4338CA',     // Indigo-700
          accent: '#8B5CF6',   // Purple-500
          highlight: '#A78BFA', // Purple-400
        },
        // Success colors
        success: {
          DEFAULT: '#10B981',  // Emerald-500
          light: '#34D399',    // Emerald-400
          dark: '#059669',     // Emerald-600
        },
        // Warning colors
        warning: {
          DEFAULT: '#F59E0B',  // Amber-500
          light: '#FBBF24',    // Amber-400
          dark: '#D97706',     // Amber-600
        },
        // Danger colors
        danger: {
          DEFAULT: '#EF4444',  // Red-500
          light: '#F87171',    // Red-400
          dark: '#DC2626',     // Red-600
        },
        // Info colors
        info: {
          DEFAULT: '#3B82F6',  // Blue-500
          light: '#60A5FA',    // Blue-400
          dark: '#2563EB',     // Blue-600
        },
        // Background colors
        background: {
          light: '#F9FAFB',    // Gray-50
          DEFAULT: '#F3F4F6',  // Gray-100
          dark: '#1F2937',     // Gray-800
          darker: '#111827',   // Gray-900
        },
        // Text colors
        text: {
          primary: '#111827',  // Gray-900
          secondary: '#4B5563', // Gray-600
          tertiary: '#6B7280',  // Gray-500
          light: '#F9FAFB',    // Gray-50
        },
        // Gradient colors
        gradient: {
          start: '#4F46E5',   // Indigo-600
          end: '#8B5CF6',     // Purple-500
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(139, 92, 246, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
