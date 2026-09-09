/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1214",
        rose: {
          DEFAULT: "#C45B7A",
          deep: "#9E3D5C",
          soft: "#E8B4C4",
          mist: "#F7E8ED",
        },
        champagne: "#F4E6D8",
        cream: "#FBF7F4",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Figtree"', "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "soft-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s ease-out both",
        "fade-up-delay": "fade-up 0.8s ease-out 0.15s both",
        "fade-up-late": "fade-up 0.8s ease-out 0.3s both",
        "soft-in": "soft-in 1s ease-out both",
      },
    },
  },
  plugins: [],
};
