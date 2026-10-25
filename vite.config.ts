import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    hmr: {
      clientPort: 8080,
    },
  },
  plugins: [
    react(),
    mcpPlugin(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "favicon.ico"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        // 25/10 (poids 4G) : le précache téléchargeait 17 Mo en arrière-plan à la 1re visite (photos de marque 7,5 Mo,
        // garage-floor.png 4,2 Mo, admin 1,3 Mo). Il ne garde plus que la coque de l'appli ; les images sont mises
        // en cache à la première vue (runtimeCaching ci-dessous).
        globPatterns: ["**/*.{js,css,html,ico,svg,woff,woff2}", "pwa-*.png", "favicon*.{png,ico}", "apple-touch-icon.png"],
        // 19/10 : packshots catégories servis à la demande, pas dans le précache (14 fichiers, ~600 Ko)
        globIgnores: ["**/categories/**", "**/skot/**", "**/assets/Admin-*"], // 25/10 : poses de SKOT chargées à l'ouverture du chat, HD marketing jamais précachées ; admin jamais chez le client
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        runtimeCaching: [
          {
            urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === "image",
            handler: "CacheFirst",
            options: { cacheName: "pt-images", expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 3600 } },
          },
        ],
      },
      manifest: {
        short_name: "PiècesTrott",
        name: "Pièces Trottinettes",
        start_url: "/",
        display: "standalone",
        background_color: "#F5F0E8",
        theme_color: "#F5F0E8",
        orientation: "portrait",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tooltip'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-easy-crop", "browser-image-compression"],
  },
}));
