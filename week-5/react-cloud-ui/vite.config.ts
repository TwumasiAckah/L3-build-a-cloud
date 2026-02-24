import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      // Proxy any request starting with /api to your backend
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
