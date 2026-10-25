import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { installAffiliateClickTracker } from "./lib/affiliateClicks";

// Initialize Sentry for error tracking
initSentry();

// 23/10/2026 : compte chaque clic sur un lien partenaire (rel="sponsored"), voir src/lib/affiliateClicks.ts.
installAffiliateClickTracker();

// 20/10/2026 : après une publication, un index.html resté en cache (service worker) peut pointer vers un
// morceau JS qui n'existe plus (404 « Failed to fetch dynamically imported module ») → page blanche.
// Vite émet alors « vite:preloadError » : on recharge UNE fois pour récupérer la nouvelle version
// (garde de 30 s en sessionStorage contre toute boucle de rechargement).
window.addEventListener("vite:preloadError", (event) => {
  try {
    const last = Number(sessionStorage.getItem("pt-chunk-reload") || 0);
    if (Date.now() - last < 30_000) return;
    sessionStorage.setItem("pt-chunk-reload", String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  // 25/10/2026 : recharger seul ne suffisait pas — le service worker resservait le même index.html périmé
  // (constaté : 1 rechargement, PartDetail-*.js en 404, page blanche). On retire d'abord le service worker
  // et ses caches (registerSW le réinstalle au chargement suivant), puis on recharge.
  const purge = async () => {
    try {
      const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
      await Promise.all(regs.map((r) => r.unregister()));
      if ("caches" in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
    } catch {
      /* rien à purger */
    }
  };
  void purge().finally(() => window.location.reload());
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
