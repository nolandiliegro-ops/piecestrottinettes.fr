// Entrée « Prends ta trott en photo » (28/10/2026, idée reprise de Weebot « Par photo ») :
// le bouton n'apparaît que si SKOT est monté sur la page ; un clic ouvre SKOT et l'appareil photo dans le même geste.
// ?photo=0 retire les boutons (comparaison avant / après).
import { useEffect, useState } from "react";

const photoEntryOff = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    const q = new URLSearchParams(window.location.search).get("photo");
    if (q === "0" || q === "1") window.sessionStorage.setItem("pt-photo-entry", q);
    return window.sessionStorage.getItem("pt-photo-entry") === "0";
  } catch { return false; }
};

export const useSkotPhoto = () => {
  const read = () => typeof window !== "undefined" && !!(window as any).__skotPhoto && !photoEntryOff();
  const [ready, setReady] = useState(read);
  useEffect(() => {
    const on = () => setReady(read());
    on();
    window.addEventListener("skot:photo-ready", on);
    return () => window.removeEventListener("skot:photo-ready", on);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return { ready, open: () => window.dispatchEvent(new Event("skot:photo")) };
};
