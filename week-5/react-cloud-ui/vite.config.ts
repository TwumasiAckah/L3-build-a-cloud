import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // optional: your dev server port
    proxy: {
      // Proxy any request starting with /api to your backend
      "/api": {
        target: "http://localhost:8000", // your backend API
        changeOrigin: true,
        secure: true, // set false if using self-signed cert
        // rewrite: (path) => path.replace(/^\/api/, ""), // optional: remove /api prefix
      },
    },
  },
});
