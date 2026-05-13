import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [
    tanstackStart({
      customViteReactPlugin: true,
      server: { entry: "server" },
    }),
    nitro(),
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
  nitro: {
    preset: "vercel",
  },
})
