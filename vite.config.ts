import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// Aperçus de liens (28/10/2026) : WhatsApp sur iPhone fabrique l'aperçu depuis le téléphone, sans JavaScript et sans
// le pré-rendu Lovable (réservé aux robots vérifiés). On écrit donc, au build, une copie de index.html par fiche
// (dist/<route>/<slug>/index.html) avec son titre, sa description et son image d'aperçu en dur. L'hébergeur sert ce
// fichier à l'adresse propre /<route>/<slug> (testé le 28/10). Le site démarre exactement comme avec index.html.
// Données : config/og/pages.json, écrit par scripts/og/generate.mjs (workflow og-images). Manifeste absent = rien.
const escAttr = (v: string) => String(v ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function ogPages() {
  return {
    name: "og-pages",
    apply: "build" as const,
    async closeBundle() {
      try {
        const out = path.resolve(__dirname, "dist");
        const manifest = path.resolve(__dirname, "config/og/pages.json");
        if (!fs.existsSync(manifest) || !fs.existsSync(path.join(out, "index.html"))) return;
        const pages: { p: string; t: string; d: string; i: string }[] = JSON.parse(fs.readFileSync(manifest, "utf8"));
        // 28/10 : les images du stockage Supabase portent « x-robots-tag: none » → WhatsApp n'affiche pas l'image.
        // On les recopie dans dist/og/ pour les servir depuis le site (même domaine, cache CDN, sans cet en-tête).
        // Image non récupérée = repli sur la fonction og-image (sans x-robots-tag, a déjà marché sur WhatsApp).
        const STORE = "https://kqsxscjtlipregkrmucg.supabase.co/storage/v1/object/public/og-images/";
        const FN = "https://kqsxscjtlipregkrmucg.supabase.co/functions/v1/og-image";
        const imageUrl = new Map<string, string>();
        const grab = async (rel: string) => {
          try {
            const r = await fetch(STORE + rel, { signal: AbortSignal.timeout(20000) });
            if (!r.ok) return;
            const b = Buffer.from(await r.arrayBuffer());
            if (b.length < 2000 || b[0] !== 0xff || b[1] !== 0xd8) return;
            const f = path.join(out, "og", rel);
            fs.mkdirSync(path.dirname(f), { recursive: true });
            fs.writeFileSync(f, b);
            imageUrl.set(rel, `https://piecestrottinettes.fr/og/${rel}`);
          } catch { /* repli fonction */ }
        };
        const rels = ["page/default.jpg", ...pages.map((pg) => (pg.i.split("/og-images/")[1] || "")).filter((r) => /^[a-z]+\/[a-z0-9-]+\.jpg$/.test(r))];
        for (let k = 0; k < rels.length; k += 24) await Promise.all(rels.slice(k, k + 24).map(grab));
        const imgFor = (rel: string) => imageUrl.get(rel) || `${FN}?k=${rel.split("/")[0]}&s=${rel.split("/")[1].replace(/\.jpg$/, "")}`;
        // Page d'accueil et toutes les pages sans fiche : image par défaut servie par le site.
        let base = fs.readFileSync(path.join(out, "index.html"), "utf8")
          .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${escAttr(imgFor("page/default.jpg"))}$2`)
          .replace("</head>", `<meta name="twitter:image" content="${escAttr(imgFor("page/default.jpg"))}" data-rh="true"></head>`);
        fs.writeFileSync(path.join(out, "index.html"), base);
        console.log(`[og-pages] images recopiées sur le site : ${imageUrl.size}/${rels.length}`);
        let n = 0;
        for (const pg of pages) {
          if (!/^\/(scooter|piece|marque|categorie)\/[a-z0-9][a-z0-9-]*$/.test(pg.p)) continue;
          const rel = pg.i.split("/og-images/")[1] || "page/default.jpg";
          const t = escAttr(pg.t), d = escAttr(pg.d), i = escAttr(imgFor(rel)), u = escAttr(`https://piecestrottinettes.fr${pg.p}`);
          let html = base
            .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
            .replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`)
            .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`)
            .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`)
            .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${i}$2`);
          html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${i}$2`)
            .replace("</head>", `<meta property="og:url" content="${u}" data-rh="true"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"></head>`);
          const dir = path.join(out, pg.p);
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, "index.html"), html);
          n++;
        }
        console.log(`[og-pages] ${n} pages d'aperçu écrites`);
      } catch (e) {
        console.warn("[og-pages] ignoré :", e);
      }
    },
  };
}

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
    ogPages(),
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
        globIgnores: ["**/categories/**", "**/skot/**", "**/assets/Admin-*", "scooter/**", "piece/**", "marque/**", "categorie/**", "og/**"], // 25/10 : poses de SKOT chargées à l'ouverture du chat, HD marketing jamais précachées ; admin jamais chez le client
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
