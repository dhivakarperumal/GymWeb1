import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Force reload for .env changes
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173, 
    proxy: {
      "/api": {
        target: "https://dap.qtechx.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
