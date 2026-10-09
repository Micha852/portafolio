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
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};
