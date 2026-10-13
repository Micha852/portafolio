/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Los valores cambian según el tema (ver globals.css)
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        warm: "rgb(var(--warm) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        blink: {
          "0%, 49%": { opacity: 1 },
          "50%, 100%": { opacity: 0 },
        },
        // Latido: crece un poco y emite un halo ámbar
        heartbeat: {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgb(var(--warm) / 0.45)" },
          "15%": { transform: "scale(1.025)" },
          "30%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.02)" },
          "70%": { boxShadow: "0 0 0 14px rgb(var(--warm) / 0)" },
        },
        pop: {
          "0%": { opacity: 0, transform: "scale(0.9) translateY(6px)" },
          "100%": { opacity: 1, transform: "none" },
        },
      },
      animation: {
        pop: "pop 0.45s ease-out",
        heartbeat: "heartbeat 1.8s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};
