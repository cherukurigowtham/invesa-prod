/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        canvas: "#0b0b0b",
        panel: "#121212",
        gold: "#d7a541",
        sand: "#f4df96",
        graphite: "#71717a"
      },
      boxShadow: {
        glow: "0 25px 80px rgba(215, 165, 65, 0.18)"
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Helvetica", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};
