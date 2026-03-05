import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/sleep_app/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Sleep Tracker",
        short_name: "Sleep",
        start_url: "/sleep_app/",
        scope: "/sleep_app/",
        display: "standalone",
        background_color: "#1f1f1f",
        theme_color: "#1f1f1f",
      },
    }),
  ],
});
