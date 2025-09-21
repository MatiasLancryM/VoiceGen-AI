import { defineConfig } from "vite"

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["bufferutil", "utf-8-validate", "electron", "fs", "path", "os", "crypto"],
    },
  },
  resolve: {
    // Handle Node.js built-ins
    alias: {
      "node:fs": "fs",
      "node:path": "path",
      "node:os": "os",
      "node:crypto": "crypto",
    },
  },
})
