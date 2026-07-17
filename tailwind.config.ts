import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#f8fafc",
        brand: "#2563eb",
        mint: "#0f766e",
        amber: "#b45309"
      }
    }
  },
  plugins: []
};

export default config;
