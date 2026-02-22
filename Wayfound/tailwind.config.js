/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          midnightIndigo: "#1B0F3B",
          royalPurple: "#3A1FA8",
          electricViolet: "#5B3DF5",
        },
        accent: {
          crimsonMagenta: "#D81E5B",
          hotCoral: "#FF4D4D",
        },
        glow: {
          neonLilac: "#B58CFF",
          softPinkGlow: "#F3A6C8",
        },
        neutral: {
          background: "#F5F6FA",
          surface: "#FFFFFF",
          textPrimary: "#2A2E34",
          textSecondary: "#67717B",
          divider: "#D5D9DD",
        },
      },
    },
  },
  plugins: [],
};
