/**
 * /garage — propositions du 18/10/2026 (?vue=1..5). Sans paramètre, la page reste telle quelle.
 * Retour de Nolan : garder le « délire garage » (wallpaper, trott en vedette), mais plus joli et moins long.
 * Constat (téléphone, compte NOLAN2.0) : 6 312 px de haut ; la trott n'arrive qu'en 3e écran ; 12 cartes pièces en
 * grille (≈ 2 000 px) ; titre « Pièces compatibles » blanc sur wallpaper clair, illisible ; cartes verre arrondies.
 * Commun aux 5 (téléphone) : pièces en frise au doigt, titre des pièces sur plaque carbone, titres Unbounded italique.
 * Le rendu ordinateur n'est retouché que par l'habillage (couleurs/coins), pas par l'ordre.
 */
import type { CSSProperties } from "react";

export type GarageVue = 1 | 2 | 3 | 4 | 5;
export type GarageTab = "trott" | "entretien" | "tutos" | "pieces";

/** Validé par Nolan le 18/10 : « 1 » (la page de base en DA Atelier) par défaut. ?vue=2..5 autres propositions, ?vue=0 = ancienne page. */
export const readGarageVue = (): 0 | GarageVue => {
  try {
    const raw = new URLSearchParams(window.location.search).get("vue");
    if (raw === null) return 1;
    const n = Number(raw);
    return n >= 1 && n <= 5 ? (n as GarageVue) : n === 0 ? 0 : 1;
  } catch {
    return 1;
  }
};

const CHAMFER = "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)";
const TABS: { id: GarageTab; label: string }[] = [
  { id: "trott", label: "Ma trott" },
  { id: "entretien", label: "Entretien" },
  { id: "tutos", label: "Tutos" },
  { id: "pieces", label: "Pièces" },
];
/** Contenu de chaque onglet (variantes à onglets 2 et 5). */
const TAB_SLOTS: Record<GarageTab, string[]> = {
  trott: ["hero", "stats", "code", "rider", "photo"],
  entretien: ["suivi"],
  tutos: ["aside"],
  pieces: ["parts"],
};
const ALL_SLOTS = ["hero", "stats", "code", "rider", "photo", "suivi", "aside", "parts"];

// Seules les CARTES verre (div/section/aside arrondis) changent d'habit ; boutons, pastilles et flèches restent tels quels.
const CARD = (v: number) => `[data-gvue="${v}"] :is(div,section,aside)[class*="backdrop-blur"]:is([class*="rounded-3xl"],[class*="rounded-2xl"])`;
const light = (v: number) => `
  ${CARD(v)}{background:rgba(250,250,248,0.95)!important;border-color:transparent!important;border-radius:0!important;clip-path:${CHAMFER};box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
`;
const dark = (v: number) => `
  ${CARD(v)}{background:rgba(26,26,26,0.86)!important;border-color:transparent!important;border-radius:0!important;clip-path:${CHAMFER};box-shadow:none!important;color:#fff}
  ${CARD(v)} :is(.text-gray-900,.text-gray-800,.text-gray-700,.text-black){color:#fff!important}
  ${CARD(v)} :is(.text-gray-600,.text-gray-500,.text-gray-400){color:rgba(255,255,255,0.72)!important}
`;

/** Variante 1 — « la page de base, en nouvelle DA » (retour Nolan 18/10) : même ordre, même verre sur le
 *  wallpaper, mais identité Atelier partout sur la page : Unbounded italique, Plus Jakarta, coins coupés,
 *  vert à la place de l'orange (l'orange reste réservé à l'achat). */
const ATELIER_PAGE = `
  main:has([data-gvue="1"]){font-family:'Plus Jakarta Sans',sans-serif}
  main:has([data-gvue="1"]) :is(h1,h2,h3,.font-black){font-family:'Unbounded',sans-serif!important;font-style:italic;font-weight:900!important;letter-spacing:-0.02em}
  main:has([data-gvue="1"]) :is(div,section,aside,a)[class*="rounded-3xl"],
  main:has([data-gvue="1"]) :is(div,section,aside,a)[class*="rounded-2xl"][class*="backdrop-blur"]{border-radius:0!important;clip-path:${CHAMFER}}
  main:has([data-gvue="1"]) :is(div,section,aside)[class*="backdrop-blur"]:is([class*="rounded-3xl"],[class*="rounded-2xl"]):not([class*="bg-black"]):not([class*="bg-gray-9"]):not([class*="bg-stone-9"]){background:rgba(250,250,248,0.84)!important;border-color:transparent!important;box-shadow:0 14px 34px -16px rgba(0,0,0,0.45)!important}
  main:has([data-gvue="1"]) button:is(.rounded-xl,.rounded-lg,.rounded-2xl){border-radius:0!important;clip-path:polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)}
  main:has([data-gvue="1"]) :is(.bg-orange-500,.bg-orange-600,[class*="from-orange"]){background:#4A7C59!important}
  main:has([data-gvue="1"]) :is([style*="FF6600" i],[style*="255, 102, 0"],[style*="FF8533" i]){background:#4A7C59!important}
  main:has([data-gvue="1"]) :is(.text-orange-300,.text-orange-400,.text-orange-500){color:#8FBF9C!important}
`;

const mobileOrder = (v: number, order: string[]) =>
  `@media (max-width:1023px){${order.map((s, i) => `[data-gvue="${v}"] [data-slot="${s}"]{order:${i + 1}!important}`).join("")}}`;

const GarageVueStyles = ({ vue, tab }: { vue: GarageVue; tab: GarageTab }) => {
  const common = `
    [data-gvue] h2,[data-gvue] h3{font-family:'Unbounded',sans-serif!important;font-style:italic;font-weight:900!important;letter-spacing:-0.02em}
    [data-gvue] [data-slot="parts-head"]{background:#1A1A1A;padding:14px 16px;clip-path:${CHAMFER}}
    [data-gvue] [data-slot="parts-head"] h2{color:#fff;font-size:20px;line-height:1.1;text-shadow:none}
    [data-gvue] [data-slot="parts-head"] p{color:rgba(255,255,255,0.75)}
    @media (max-width:1023px){
      [data-gvue] [data-slot="parts-grid"]{display:flex!important;overflow-x:auto;gap:12px;margin:0 -16px;padding:0 16px 8px;scrollbar-width:none}
      [data-gvue] [data-slot="parts-grid"] > *{flex:0 0 46%;min-width:0}
    }
  `;
  let css = common;
  if (vue === 1) css += ATELIER_PAGE;
  if (vue === 2) css += light(2) + mobileOrder(2, ["hero", "stats", "code", "rider", "photo", "suivi", "aside"]);
  if (vue === 3) css += dark(3) + mobileOrder(3, ["hero", "stats", "rider", "code", "suivi", "photo", "aside"]);
  if (vue === 4)
    css +=
      light(4) +
      mobileOrder(4, ["hero", "stats", "rider", "code", "suivi", "photo", "aside"]) +
      `@media (max-width:1023px){[data-gvue="4"] [data-slot="hero"]{margin:0 -16px;min-height:62vh;background:linear-gradient(180deg,rgba(26,26,26,0) 55%,rgba(26,26,26,0.55))}}`;
  if (vue === 5) css += dark(5) + mobileOrder(5, ["hero", "stats", "code", "rider", "photo", "suivi", "aside"]);
  if (vue === 2 || vue === 5) {
    const keep = TAB_SLOTS[tab];
    css += `@media (max-width:1023px){${ALL_SLOTS.filter((s) => !keep.includes(s))
      .map((s) => `[data-gvue="${vue}"] [data-slot="${s}"], [data-gvue="${vue}"][data-slot="${s}"]{display:none!important}`)
      .join("")}}`;
  }
  return <style>{css}</style>;
};

/** Barre d'onglets collante (téléphone) pour les variantes 2 et 5. */
export const GarageVueTabs = ({ vue, tab, onTab }: { vue: GarageVue; tab: GarageTab; onTab: (t: GarageTab) => void }) => {
  if (vue !== 2 && vue !== 5) return null;
  const darkTone = vue === 5;
  return (
    <div className="lg:hidden sticky top-16 z-30 -mx-4 px-4 py-2 mb-3" style={{ background: darkTone ? "rgba(26,26,26,0.92)" : "rgba(250,250,248,0.95)" }}>
      <div className="grid grid-cols-4 gap-1.5" role="tablist" aria-label="Sections du garage">
        {TABS.map((t) => {
          const on = t.id === tab;
          const style: CSSProperties = {
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
            background: on ? (darkTone ? "#4A7C59" : "#1A1A1A") : darkTone ? "rgba(255,255,255,0.10)" : "#fff",
            color: on ? "#fff" : darkTone ? "#fff" : "#1A1A1A",
            boxShadow: on || darkTone ? "none" : "inset 0 0 0 1px #E2DCD0",
          };
          return (
            <button key={t.id} type="button" role="tab" aria-selected={on} onClick={() => { onTab(t.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="min-h-[44px] text-sm font-extrabold uppercase tracking-wide" style={style}>
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GarageVueStyles;
