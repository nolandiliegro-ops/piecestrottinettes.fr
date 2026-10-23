/**
 * Icônes des volets « Tout savoir sur cette pièce » — 5 propositions (24/10/2026), ?icones=1..5.
 * Sans paramètre (ou ?icones=0) : carré carbone à angle coupé + pictogramme lucide (rendu d'origine).
 * 1 Cercle · 2 Numéros · 3 Dessinées · 4 Écrou · 5 Tache
 */
import { useSearchParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

export type FoldKey = "presentation" | "distingue" | "montage" | "tech" | "choisir" | "faq";

const GREEN = "#4A7C59";
const CARBON = "#1A1A1A";
const BEIGE = "#F5F0E8";
const CHAMFER = "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)";
const HEX = "polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)";

export const useIconStyle = () => {
  const [params] = useSearchParams();
  const n = Number(params.get("icones"));
  return n >= 1 && n <= 5 ? n : 0;
};

/* Pictogrammes dessinés pour la proposition 3 : un objet d'atelier par volet, en deux tons. */
const Drawn = ({ k }: { k: FoldKey }) => {
  const s = { fill: "none", stroke: CARBON, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const g = { fill: GREEN, opacity: 0.9 };
  switch (k) {
    case "presentation": // étiquette produit
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden>
          <path d="M5 6h13l9 10-11 11L5 16z" {...g} transform="translate(1.5 1.5)" />
          <path d="M5 6h13l9 10-11 11L5 16z" {...s} />
          <circle cx="11" cy="12" r="2" {...s} />
        </svg>
      );
    case "distingue": // étincelle
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden>
          <path d="M16 5l2.6 7.4L26 15l-7.4 2.6L16 25l-2.6-7.4L6 15l7.4-2.6z" {...g} transform="translate(1.5 1.5)" />
          <path d="M16 5l2.6 7.4L26 15l-7.4 2.6L16 25l-2.6-7.4L6 15l7.4-2.6z" {...s} />
        </svg>
      );
    case "montage": // clé plate sur un écrou
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden>
          <path d="M20 4l6 3.5v7L20 18l-6-3.5v-7z" {...g} />
          <path d="M17 13L6 24a2.5 2.5 0 003.5 3.5L20.5 16" {...s} />
          <path d="M21 4.5a6 6 0 00-4.6 8.2L18 14l1.4 1.6a6 6 0 008.2-4.6l-3.6 1-2.8-2.8z" {...s} />
        </svg>
      );
    case "tech": // pied à coulisse
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden>
          <rect x="4" y="13" width="24" height="6" {...g} />
          <path d="M4 13h24v6H4zM8 13V6M8 6h4v7M20 19v7M20 26h4v-7M12 16h1M16 16h1M20 16h1M24 16h1" {...s} />
        </svg>
      );
    case "choisir": // loupe sur un pneu
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden>
          <circle cx="13" cy="13" r="8.5" {...g} transform="translate(1.5 1.5)" />
          <circle cx="13" cy="13" r="8.5" {...s} />
          <circle cx="13" cy="13" r="3.5" {...s} />
          <path d="M19.5 19.5L27 27" {...s} strokeWidth={2.6} />
        </svg>
      );
    case "faq": // bulle question
      return (
        <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden>
          <path d="M5 6h22v15H14l-6 5v-5H5z" {...g} transform="translate(1.5 1.5)" />
          <path d="M5 6h22v15H14l-6 5v-5H5z" {...s} />
          <path d="M13.5 11.5a2.5 2.5 0 115 .3c0 1.6-2.5 1.9-2.5 3.6M16 18v.2" {...s} />
        </svg>
      );
  }
};

/** Pictogramme placé devant le titre d'un volet. `n` = rang du volet (proposition 2). */
export const FoldIcon = ({ k, Icon, n, style }: { k?: FoldKey; Icon?: LucideIcon; n?: number; style: number }) => {
  if (!Icon && !k) return null;
  if (style === 1) {
    return (
      <span aria-hidden className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors text-[#4A7C59] group-open:bg-[#4A7C59] group-open:text-white" style={{ boxShadow: `inset 0 0 0 1.5px ${GREEN}` }}>
        {Icon && <Icon className="w-5 h-5" strokeWidth={1.6} />}
      </span>
    );
  }
  if (style === 2) {
    return (
      <span aria-hidden className="shrink-0 w-10 text-[34px] leading-none tabular-nums transition-colors group-open:text-[#4A7C59]" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#C9C1B2" }}>
        {String(n ?? 1).padStart(2, "0")}
      </span>
    );
  }
  if (style === 3 && k) {
    return (
      <span aria-hidden className="shrink-0 w-11 h-11 flex items-center justify-center" style={{ background: BEIGE, clipPath: CHAMFER }}>
        <Drawn k={k} />
      </span>
    );
  }
  if (style === 4) {
    return (
      <span aria-hidden className="shrink-0 relative w-11 h-10 flex items-center justify-center">
        <span className="absolute inset-0 transition-colors group-open:bg-[#4A7C59]" style={{ background: CARBON, clipPath: HEX }} />
        <span className="absolute inset-[3px]" style={{ background: "#fff", clipPath: HEX }} />
        <span className="absolute inset-[7px] transition-colors group-open:bg-[#4A7C59]" style={{ background: CARBON, clipPath: HEX }} />
        {Icon && <Icon className="relative w-4 h-4 text-white" strokeWidth={2.2} />}
      </span>
    );
  }
  if (style === 5) {
    return (
      <span aria-hidden className="shrink-0 relative w-11 h-11 flex items-center justify-center">
        <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full">
          <path d="M23 3c9 0 17 6 18 15s-4 19-13 22S7 40 4 30 9 3 23 3z" fill={GREEN} opacity="0.18" className="transition-opacity group-open:opacity-40" />
        </svg>
        {Icon && <Icon className="relative w-6 h-6" strokeWidth={2.2} style={{ color: CARBON }} />}
      </span>
    );
  }
  return (
    <span aria-hidden className="shrink-0 w-9 h-9 flex items-center justify-center text-white transition-colors group-open:bg-[#4A7C59]" style={{ background: CARBON, clipPath: CHAMFER }}>
      {Icon && <Icon className="w-4 h-4" />}
    </span>
  );
};
