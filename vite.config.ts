import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import { fileURLToPath } from "url";

// Use fileURLToPath instead of import.meta.dirname for Node 18 compatibility
const baseDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(baseDir, "client", "src"),
      "@shared": path.resolve(baseDir, "shared"),
      "@assets": path.resolve(baseDir, "attached_assets"),
    },
  },
  root: path.resolve(baseDir, "client"),
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(baseDir, "dist/public"),
    emptyOutDir: true,
  },
});
