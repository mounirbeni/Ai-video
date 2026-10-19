import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { brand: { DEFAULT: "#e50914", dark: "#b20710" } },
      fontFamily: { sans: ["Cairo", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
