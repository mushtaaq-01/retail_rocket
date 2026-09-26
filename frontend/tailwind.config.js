/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#020817",
        darkCard: "#0a1630",
        darkCardHeader: "#0d1b3e",
        purpleAccent: "#7c3aed",
        blueAccent: "#2563eb",
        cyanAccent: "#06b6d4",
        greenAccent: "#10b981",
        glowBorder: "rgba(124, 58, 237, 0.25)"
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(124, 58, 237, 0.4)',
        'glow-blue': '0 0 25px -5px rgba(37, 99, 235, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at center, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
      }
    },
  },
  plugins: [],
}
