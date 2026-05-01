/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "Inter", "sans-serif"]
      },
      colors: {
        panel: "#1e293b",
        surface: "#0f172a",
        card: "#111c2f"
      },
      boxShadow: {
        soft: "0 10px 24px rgba(2, 6, 23, 0.35)"
      }
    }
  },
  plugins: []
};
