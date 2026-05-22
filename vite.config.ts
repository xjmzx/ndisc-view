import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/  (test block — https://vitest.dev/config/)
export default defineConfig({
  plugins: [
    react(),
    // PWA — makes ndisc-view installable as a standalone desktop/Android app
    // (own window + icon) and caches the shell for offline launch.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "ndisc-view",
        short_name: "ndisc-view",
        description:
          "Read-only viewer for an ndisc music discography on Nostr.",
        theme_color: "#0a0e13",
        background_color: "#0a0e13",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
