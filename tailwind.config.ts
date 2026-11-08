import type { Config } from "tailwindcss";

// Mismo sistema de diseño de la web (index.html) y del panel Vue, ahora con dos temas.
// Los colores salen de variables CSS (ver globals.css): oscuro = valores originales, claro = paleta con contraste AA.
const v = (n: string) => `rgb(var(--c-${n}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk Variable"', "Space Grotesk", "sans-serif"],
        body: ['"Outfit Variable"', "Outfit", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "JetBrains Mono", "monospace"],
      },
      colors: {
        px: {
          base: v("base"), surface: v("surface"), elevated: v("elevated"), overlay: v("overlay"),
          cyan: v("cyan"), purple: v("purple"), green: v("green"), pink: v("pink"), danger: v("danger"),
          text: v("fg"), muted: v("muted"), faint: v("faint"),
          border: "rgb(var(--c-fg) / calc(0.08 * var(--k)))",
        },
        fg: v("fg"),            // tinta: blanco en oscuro, azul pizarra casi negro en claro
        onaccent: v("on-accent"), // texto sobre rellenos de acento (cyan / verde)
        scrim: v("scrim"),
        sena: { green: "#39A900", blue: "#1F4E79" },
      },
      boxShadow: {
        "glow-cyan": "0 0 24px rgb(var(--c-cyan) / calc(0.35 * var(--ks)))",
        "glow-purple": "0 0 32px rgb(var(--c-purple) / calc(0.25 * var(--ks)))",
      },
      keyframes: {
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "slide-up": "slideUp 0.25s ease forwards",
        "fade-in": "fadeIn 0.2s ease forwards",
      },
    },
  },
  plugins: [],
};
export default config;
