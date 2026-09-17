/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        solana: {
          purple: "#9945FF",
          green: "#14F195",
        },
        shield: {
          cyan: "#00F0FF",
          dark: "#0a0b10",
          card: "#12141e",
          border: "#1f2338",
        },
      },
    },
  },
  plugins: [],
};
