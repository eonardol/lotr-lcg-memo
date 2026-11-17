import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

const appVersionPlugin = (): Plugin => ({
  name: "emit-app-version",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "version.js",
      source: readFileSync(fileURLToPath(new URL("./version.js", import.meta.url)), "utf8"),
    });
  },
});

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    appVersionPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest,mp3}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2020",
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
      },
    },
  },
});
