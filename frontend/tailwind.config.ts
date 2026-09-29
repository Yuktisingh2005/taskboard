  import type { Config } from "tailwindcss";

  const config: Config = {
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          
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