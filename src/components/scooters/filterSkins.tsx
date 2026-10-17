/**
 * Habillages « racing » de la barre de filtres + recherche de /trottinettes (17/10/2026,
 * skill « cinq propositions rendues »). Activés UNIQUEMENT par ?filtres=1..5 : sans paramètre, rien ne change.
 * Défaut corrigé dans les 5 : pastilles rondes génériques et champ de recherche « formulaire » sans identité.
 *
 * 1 PLAQUES      · plaques à coin coupé (comme la compat des fiches), recherche carbone + bouton en biseau
 * 2 COCKPIT      · bandeau carbone : recherche et filtres sur fond noir, onglet actif souligné vert
 * 3 GRILLE       · tuiles numérotées 01…07 à filet vert (comme les tuiles de caractéristiques), recherche à damier
 * 4 BISEAU       · boutons en parallélogramme avec ombre décalée, recherche penchée
 * 5 TÉLÉMÉTRIE   · onglets texte soulignés, grande recherche sur une ligne, compteur géant
 */
import type { CSSProperties } from "react";

export type FilterLook = 1 | 2 | 3 | 4 | 5;
export const UNB = "'Unbounded', sans-serif";
export const FONT = "'Plus Jakarta Sans', sans-serif";
export const CARBON = "#1A1A1A";
export const GREEN = "#4A7C59";
export const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)";
export const CHECKER = `conic-gradient(${CARBON} 25%, #fff 0 50%, ${CARBON} 0 75%, #fff 0)`;

type Btn = { cls: string; style: CSSProperties; inner?: CSSProperties };

/** Bouton de filtre (ordinateur) et bouton « Filtres » (téléphone). */
export const trigger = (look: FilterLook, on: boolean): Btn => {
  const base = "h-11 inline-flex items-center gap-2 text-sm transition-all duration-150";
  switch (look) {
    case 1: return { cls: `${base} pl-3.5 pr-4 font-extrabold uppercase tracking-wide`, style: { fontFamily: FONT, clipPath: CHAMFER, background: on ? CARBON : "#fff", color: on ? "#fff" : CARBON, boxShadow: on ? "none" : `inset 0 0 0 1px ${LINE}` } };
    case 2: return { cls: `${base} px-4 font-bold uppercase tracking-[0.12em]`, style: { fontFamily: FONT, color: on ? "#fff" : "rgba(255,255,255,0.7)", background: on ? "rgba(255,255,255,0.08)" : "transparent", boxShadow: on ? `inset 0 -3px 0 ${GREEN}` : "inset 0 -1px 0 rgba(255,255,255,0.12)", borderRadius: 4 } };
    case 3: return { cls: `${base} pl-3 pr-2.5 gap-1.5 font-bold uppercase relative overflow-hidden`, style: { fontFamily: FONT, background: on ? GREEN : "#fff", color: on ? "#fff" : CARBON, borderRadius: 6, boxShadow: on ? "none" : `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` } };
    case 4: return { cls: `${base} px-4 -skew-x-12 font-extrabold uppercase tracking-wide hover:-translate-y-0.5`, style: { fontFamily: FONT, fontStyle: "italic", background: on ? GREEN : "#fff", color: on ? "#fff" : CARBON, borderRadius: 3, boxShadow: `3px 3px 0 ${CARBON}`, border: `1px solid ${CARBON}` }, inner: { transform: "skewX(12deg)" } };
    case 5: return { cls: `${base} px-1 font-bold uppercase tracking-[0.14em]`, style: { fontFamily: FONT, color: on ? GREEN : CARBON, boxShadow: on ? `inset 0 -3px 0 ${GREEN}` : "inset 0 -1px 0 rgba(26,26,26,0.15)" } };
  }
};

/** Compteur de sélection dans un bouton. */
export const badge = (look: FilterLook, n: number) =>
  n ? <span className="ml-0.5 text-sm" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color: look === 3 || look === 4 ? "#fff" : look === 2 ? "#9FD3AE" : GREEN }}>{n}</span> : null;

/** Menu de tri. */
export const sortCls = (look: FilterLook): { cls: string; style: CSSProperties } => {
  const base = "appearance-none h-11 pl-4 pr-10 text-sm font-bold outline-none focus:ring-2 focus:ring-green-600 cursor-pointer";
  switch (look) {
    case 1: return { cls: base, style: { fontFamily: FONT, clipPath: CHAMFER, background: "#fff", color: CARBON, boxShadow: `inset 0 0 0 1px ${LINE}` } };
    case 2: return { cls: base, style: { fontFamily: FONT, background: "rgba(255,255,255,0.08)", color: "#fff", borderRadius: 4, border: "1px solid rgba(255,255,255,0.15)" } };
    case 3: return { cls: base, style: { fontFamily: FONT, background: "#fff", color: CARBON, borderRadius: 6, boxShadow: `inset 0 0 0 1px ${LINE}` } };
    case 4: return { cls: base, style: { fontFamily: FONT, background: "#fff", color: CARBON, borderRadius: 3, border: `1px solid ${CARBON}`, boxShadow: `3px 3px 0 ${CARBON}` } };
    case 5: return { cls: `${base} pl-1 bg-transparent`, style: { fontFamily: FONT, color: CARBON, boxShadow: "inset 0 -1px 0 rgba(26,26,26,0.15)" } };
  }
};

/** Pastilles « filtre actif » sous la barre. */
export const activeChip = (look: FilterLook): { cls: string; style: CSSProperties } => ({
  cls: "h-9 pl-3 pr-2 text-sm font-semibold inline-flex items-center gap-1",
  style: look === 2 ? { fontFamily: FONT, background: CARBON, color: "#fff", borderRadius: 4 } : { fontFamily: FONT, background: "#fff", color: CARBON, borderRadius: look === 3 ? 6 : 3, boxShadow: `inset 3px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` },
});
