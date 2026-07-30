import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0F0F1A",
          900: "#151528",
          850: "#1A1A2E",
          800: "#20203A",
          700: "#2A2A4E"
        },
        signal: {
          success: "#00FF88",
          danger: "#FF4444",
          warning: "#FFAA00",
          info: "#0088FF"
        }
      },
      fontFamily: {
        sans: ["Century Gothic", "Arial", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 24px 60px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: []
};

export default config;
