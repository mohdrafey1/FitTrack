import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.ico", "icons/*.png"],
            manifest: {
                name: "FitTrack - Fitness Tracker",
                short_name: "FitTrack",
                description: "A comprehensive fitness tracking application",
                theme_color: "#1f2937",
                background_color: "#ffffff",
                display: "standalone",
                orientation: "portrait",
                scope: "/",
                start_url: "/",
                icons: [
                    {
                        src: "icons/android-chrome-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "icons/android-chrome-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "icons/apple-touch-icon.png",
                        sizes: "180x180",
                        type: "image/png",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts-cache",
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                        },
                    },
                ],
            },
        }),
    ],
});
