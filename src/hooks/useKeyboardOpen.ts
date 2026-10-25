import { useEffect, useState } from "react";

/** Clavier virtuel ouvert (iPhone / Android) : la zone visible est nettement plus basse que la fenêtre.
 *  Mesuré sur `visualViewport`, pas sur le focus : un toucher qui fait perdre le focus ne déplace rien avant le clic. */
export const useKeyboardOpen = (): boolean => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const v = typeof window !== "undefined" ? window.visualViewport : null;
    if (!v) return;
    const upd = () => setOpen(v.height < window.innerHeight - 150);
    upd();
    v.addEventListener("resize", upd);
    return () => v.removeEventListener("resize", upd);
  }, []);
  return open;
};
