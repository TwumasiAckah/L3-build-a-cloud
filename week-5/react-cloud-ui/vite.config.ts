import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
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
