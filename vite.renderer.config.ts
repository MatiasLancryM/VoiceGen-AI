import { defineConfig } from "vite"

export default defineConfig({
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "node:buffer": "buffer",
      "node:process": "process",
    },
  },
  optimizeDeps: {
    include: ["buffer", "process"],
  },
})
