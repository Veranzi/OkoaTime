import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B3D5C",
          50: "#E8F1F7",
          100: "#C5D9E9",
          200: "#9EBFD8",
          300: "#77A5C7",
          400: "#5091B9",
          500: "#2E7DAE",
          600: "#1A6A9A",
          700: "#0B3D5C",
          800: "#082F46",
          900: "#052030",
        },
        orange: {
          DEFAULT: "#E07B00",
          50: "#FFF3E0",
          100: "#FFE0B2",
          200: "#FFCC80",
          300: "#FFB74D",
          400: "#FFA726",
          500: "#E07B00",
          600: "#C56E00",
          700: "#A05900",
          800: "#7A4400",
          900: "#552F00",
        },
        teal: {
          DEFAULT: "#0096B4",
          50: "#E0F7FC",
          100: "#B2EBF7",
          200: "#80DEFB",
          300: "#4DD0F4",
          400: "#26C4EF",
          500: "#0096B4",
          600: "#0087A0",
          700: "#006E85",
          800: "#005669",
          900: "#003D4D",
        },
        brand: {
          navy: "#0B3D5C",
          orange: "#E07B00",
          teal: "#0096B4",
        },
      },
      fontFamily: {
        outfit: ["var(--font-outfit)", "sans-serif"],
        josefin: ["var(--font-josefin)", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0B3D5C 0%, #0096B4 100%)",
        "card-gradient": "linear-gradient(180deg, rgba(11,61,92,0.0) 0%, rgba(11,61,92,0.8) 100%)",
      },
      boxShadow: {
        card: "0 4px 20px rgba(11, 61, 92, 0.12)",
        "card-hover": "0 8px 32px rgba(11, 61, 92, 0.2)",
        orange: "0 4px 14px rgba(224, 123, 0, 0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        pulseSoft: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
      },
    },
  },
  plugins: [],
};
export default config;
