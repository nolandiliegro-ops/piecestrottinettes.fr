// 29/10/2026 — Bug Safari iOS 26 (WebKit 297779, forums Apple 800125) : après l'ouverture puis la fermeture du clavier,
// Safari garde une zone d'affichage faussée et les éléments `position: fixed; bottom: 0` (barre du bas) remontent
// au milieu de l'écran, le contenu défile en dessous. Capture de Nolan du 29/10, barre décrochée sur l'accueil.
// Contournement : quand le clavier se referme (plus aucun champ actif, zone visible qui regrandit), on force Safari à
// recalculer sa mise en page par un défilement d'1 px aller-retour. Sans effet ailleurs (iPhone/iPad seulement).
// 29/10 (2e capture de Nolan, Chrome iPhone) : quand la barre du navigateur (« Posez une question ») se replie au
// défilement, la zone visible grandit mais Chrome laisse les éléments `fixed; bottom: 0` à l'ancienne hauteur : la
// barre du site flotte et le contenu passe dessous. On mesure l'écart (bas de la zone visible − bas de la mise en page)
// et on l'expose en variable CSS --pt-vv-gap ; la barre du bas descend d'autant (bottom: -gap). Écart nul ailleurs.
// → RETIRÉ le même soir : sur Chrome iPhone la mesure double-comptait, la barre disparaissait sous l'écran en descendant
//   (capture de Nolan 01:55). Reste le prolongement de couleur sous la barre (MobileNavProposals) comme filet.
import { useEffect } from "react";

const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const champActif = () => {
  const a = document.activeElement as HTMLElement | null;
  return !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable);
};

export function useIosViewportFix() {
  useEffect(() => {
    if (typeof window === "undefined" || !isIOS()) return;
    const vv = window.visualViewport;
    let t: ReturnType<typeof setTimeout> | undefined;
    let last = vv?.height ?? window.innerHeight;
    const recalcule = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (champActif()) return;
        const y = window.scrollY;
        window.scrollTo(window.scrollX, y + 1);
        requestAnimationFrame(() => window.scrollTo(window.scrollX, y));
      }, 300);
    };
    const onResize = () => {
      const h = vv?.height ?? window.innerHeight;
      if (h - last > 120) recalcule(); // le clavier vient de se refermer (la zone visible regrandit d'un coup)
      last = h;
    };
    document.addEventListener("focusout", recalcule);
    vv?.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", recalcule);
    return () => {
      clearTimeout(t);
      document.removeEventListener("focusout", recalcule);
      vv?.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", recalcule);
    };
  }, []);
}
