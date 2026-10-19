import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // هوية Nexora: بنفسجي ← أزرق ← سماوي مع لمسة برتقالية، على خلفية كحلية داكنة
        brand: { DEFAULT: "#7c5cff", dark: "#5b3fe0", violet: "#8b5cf6", blue: "#3b82f6", cyan: "#22d3ee", glow: "#f59e0b" },
        neutral: { 800: "#1a1d33", 900: "#0d1022", 950: "#03040c" },
      },
      fontFamily: { sans: ["Cairo", "system-ui", "sans-serif"], logo: ["Michroma", "Cairo", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
