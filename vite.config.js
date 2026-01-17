import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "LTC Decision System",
        short_name: "LTC DS",
        description: "LTC decision prototype (forced-sell timeline first).",
        start_url: "/",
        display: "standalone",
        background_color: "#f9fafb",
        theme_color: "#111827",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ]
});
