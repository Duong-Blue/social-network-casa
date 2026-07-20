/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#7c3bed",
        "accent-pink": "#f43f5e",
        "accent-cyan": "#06b6d4",
        "background-light": "#f7f6f8",
        "background-dark": "#0F0A1F",
        "surface-dark": "#2A0E4D",
        secondary: "#64748B",
        background: "#FFFFFF",
        surface: "#F8FAFC",
        text: "#0F172A",
        textSecondary: "#475569",
        border: "#E2E8F0",
        danger: "#DC2626",
        success: "#16A34A",
        warning: "#F59E0B",
      },

      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        "2xl": 24,
        "3xl": 32,
      },

      fontSize: {
        title: 24,
        heading: 18,
        body: 14,
        caption: 12,
      },

      borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
      },
    },
  },
  plugins: [],
}
