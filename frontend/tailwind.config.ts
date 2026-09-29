  import type { Config } from "tailwindcss";

  const config: Config = {
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          // kept for any canvas pages that still reference these
          canvas: {
            bg: "#09090b",   // zinc-950
            accent: "#6366f1",
          },
        },
      },
    },
    plugins: [],
  };

  export default config;