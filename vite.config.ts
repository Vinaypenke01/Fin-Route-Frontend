import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Automatically overwrite legacy favicon.ico with official FinRoute logo
try {
  const officialLogo = path.resolve(__dirname, "./public/logo-removebg-preview (1).png");
  const faviconIco = path.resolve(__dirname, "./public/favicon.ico");
  if (fs.existsSync(officialLogo)) {
    fs.copyFileSync(officialLogo, faviconIco);
  }
} catch (err) {
  console.error("Favicon sync error:", err);
}

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: [
      "use-sync-external-store/shim/with-selector.js",
      "use-sync-external-store/shim/with-selector",
      "use-sync-external-store/shim",
      "use-sync-external-store",
      "@tanstack/react-store",
    ],
    exclude: [
      "@tanstack/start-server-core",
      "@tanstack/start-client-core",
      "@tanstack/start-storage-context",
      "@tanstack/react-start",
      "@tanstack/react-start/client",
      "@tanstack/react-start/server",
      "@tanstack/router-core",
    ],
  },
  resolve: {
    dedupe: ["react", "react-dom", "use-sync-external-store"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "node:async_hooks": path.resolve(__dirname, "./src/lib/tanstack-storage-stub.ts"),
      "async_hooks": path.resolve(__dirname, "./src/lib/tanstack-storage-stub.ts"),
      "@tanstack/start-storage-context": path.resolve(__dirname, "./src/lib/tanstack-storage-stub.ts"),
      "#tanstack-router-entry": path.resolve(__dirname, "./src/router.tsx"),
      "#tanstack-start-entry": path.resolve(__dirname, "./src/lib/tanstack-start-stub.ts"),
      "#tanstack-start-plugin-adapters": path.resolve(__dirname, "./src/lib/tanstack-adapters-stub.ts"),
      "tanstack-start-manifest:v": path.resolve(__dirname, "./src/lib/tanstack-manifest-stub.ts"),
    },
  },
  appType: "spa",
  server: {
    port: 8080,
    host: true,
  },
});
