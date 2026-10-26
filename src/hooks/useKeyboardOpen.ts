import { useEffect, useState } from "react";

/** Clavier virtuel ouvert (iPhone / Android).
 *  26/10 : sur iPhone, `window.innerHeight` rétrécit AUSSI quand le clavier sort → comparer à innerHeight ne voit rien
 *  (capture de Nolan : sélecteur du menu, clavier ouvert, rien de rangé). On compare la zone visible à la plus grande
 *  hauteur vue depuis la dernière rotation : −150 px ou plus = clavier ouvert. Mesuré sur `visualViewport`, pas sur le
 *  focus : un toucher qui fait perdre le focus ne déplace rien avant le clic. */
export const keyboardOpenFrom = (h: number, maxH: number) => h < maxH - 150;

export const useKeyboardOpen = (): boolean => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const v = typeof window !== "undefined" ? window.visualViewport : null;
    if (!v) return;
    let maxH = Math.max(v.height, window.innerHeight);
    const upd = () => {
      maxH = Math.max(maxH, v.height);
      setOpen(keyboardOpenFrom(v.height, maxH));
    };
    const reset = () => { maxH = 0; window.setTimeout(upd, 350); };
    upd();
    v.addEventListener("resize", upd);
    window.addEventListener("orientationchange", reset);
    return () => { v.removeEventListener("resize", upd); window.removeEventListener("orientationchange", reset); };
  }, []);
  return open;
};
