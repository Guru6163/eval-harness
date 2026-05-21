import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAFAF7",
        ink: "#0A0A0A",
        muted: "#737373",
        border: "#E8E8E3",
        accent: "#3F6F5C",
        pass: "#15803D",
        fail: "#B91C1C",
        partial: "#A16207",
      },
    },
  },
  plugins: [],
};

export default config;
