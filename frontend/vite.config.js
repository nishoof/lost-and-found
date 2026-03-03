import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://backend:8080",
        changeOrigin: true
      }
    }
  }
});
