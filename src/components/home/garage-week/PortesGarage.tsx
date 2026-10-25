/* Accueil, bloc « Ton garage, ton QG » (26/10/2026, Nolan : « il y a trop de texte… il faut juste mettre les boutons :
   pièces compatibles, suivi de commande, SKOT répond, carte Rider… de la façon du garage »).
   Le paragraphe disparaît ; les 4 étiquettes deviennent de vrais boutons, au dessin des onglets du Garage
   (fond papier, coin coupé, icône verte, 48 px). 5 compositions derrière `?portes=1..5` ; 0 = l'ancien bloc. */
import { Link } from "react-router-dom";
import { Bike, ChevronRight, IdCard, MessageCircle, Package } from "lucide-react";

const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SOFT = "#8FBF9C";
const PAPER = "#FAFAF8";
const ch = (c: number) => `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;

// Choix de Nolan (26/10) : 2 · Barre d'onglets, avec les mots du Garage (« Commandes », pas « Suivi de commandes »).
export const PORTES_DEFAUT = 2;
export const readPortes = (): number => {
  if (typeof window === "undefined") return PORTES_DEFAUT;
  try {
    const q = new URLSearchParams(window.location.search).get("portes");
    if (q !== null && /^[0-5]$/.test(q)) { window.sessionStorage.setItem("pt-portes", q); return Number(q); }
    const s = window.sessionStorage.getItem("pt-portes");
    return s && /^[0-5]$/.test(s) ? Number(s) : PORTES_DEFAUT;
  } catch { return PORTES_DEFAUT; }
};

type Porte = { icon: typeof Bike; label: string; court: string; to?: string; onClick?: () => void; sous: string };
const portes = (auth: boolean): Porte[] => [
  { icon: Bike, label: "Pièces compatibles", court: "Mes trotts", sous: "Que ce qui va sur ta trott", to: auth ? "/garage/trotts" : "/trottinettes" },
  { icon: Package, label: "Suivi de commandes", court: "Commandes", sous: "Chaque colis, en direct", to: auth ? "/garage/commandes" : "/register?returnTo=/garage/commandes" },
  { icon: MessageCircle, label: "SKOT répond", court: "SKOT", sous: "Compat, SAV, commandes", onClick: () => window.dispatchEvent(new Event("skot:open")) },
  { icon: IdCard, label: "Carte Rider", court: "Ma carte", sous: "À partager en story", to: auth ? "/garage" : "/register" },
];

const Bouton = ({ p, className, style, children }: { p: Porte; className: string; style: React.CSSProperties; children: React.ReactNode }) =>
  p.to
    ? <Link to={p.to} className={className} style={style}>{children}</Link>
    : <button type="button" onClick={p.onClick} className={`${className} text-left`} style={style}>{children}</button>;

const PortesGarage = ({ v, auth }: { v: number; auth: boolean }) => {
  const list = portes(auth);

  // 1 · Littéral : les 4 étiquettes deviennent les onglets du Garage, en 2 × 2.
  if (v === 1) return (
    <ul className="grid grid-cols-2 gap-1.5 max-w-lg">
      {list.map((p) => (
        <li key={p.label}>
          <Bouton p={p} className="w-full flex items-center gap-2.5 min-h-[52px] px-3.5 text-[15px] font-extrabold" style={{ fontFamily: FONT, background: PAPER, color: CARBON, clipPath: ch(10) }}>
            <p.icon className="w-[18px] h-[18px] shrink-0" style={{ color: GREEN }} />{p.label}
          </Bouton>
        </li>
      ))}
    </ul>
  );

  // 2 · Barre d'onglets : la rangée du Garage telle quelle (mêmes mots, même ordre : Ma carte, Mes trotts, Commandes, SKOT).
  if (v === 2) return (
    <ul className="-mx-4 px-4 flex gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:px-0 lg:flex-wrap">
      {[list[3], list[0], list[1], list[2]].map((p) => (
        <li key={p.label} className="shrink-0">
          <Bouton p={p} className="flex items-center gap-2.5 min-h-[48px] px-4 text-[15px] font-extrabold whitespace-nowrap" style={{ fontFamily: FONT, background: PAPER, color: CARBON, clipPath: ch(10) }}>
            <p.icon className="w-[18px] h-[18px] shrink-0" style={{ color: GREEN }} />{p.court}
          </Bouton>
        </li>
      ))}
    </ul>
  );

  // 3 · Grandes tuiles : une case par porte, l'icône dans un carré vert, un mot dessous.
  if (v === 3) return (
    <ul className="grid grid-cols-2 gap-2 max-w-lg">
      {list.map((p) => (
        <li key={p.label}>
          <Bouton p={p} className="w-full h-[104px] flex flex-col justify-between p-3" style={{ fontFamily: FONT, background: PAPER, color: CARBON, clipPath: ch(14) }}>
            <span className="w-10 h-10 inline-flex items-center justify-center" style={{ background: GREEN, clipPath: ch(7) }}><p.icon className="w-5 h-5 text-white" /></span>
            <span className="text-[15px] font-extrabold leading-tight">{p.label}</span>
          </Bouton>
        </li>
      ))}
    </ul>
  );

  // 4 · Colonne du Garage : quatre lignes pleine largeur, comme le menu du Garage sur ordinateur, avec une flèche.
  if (v === 4) return (
    <ul className="grid gap-1.5 max-w-md">
      {list.map((p) => (
        <li key={p.label}>
          <Bouton p={p} className="w-full flex items-center gap-3 min-h-[56px] px-3.5" style={{ fontFamily: FONT, background: PAPER, color: CARBON, clipPath: ch(10) }}>
            <p.icon className="w-5 h-5 shrink-0" style={{ color: GREEN }} />
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-extrabold leading-tight">{p.label}</span>
              <span className="block text-sm font-semibold" style={{ color: "#6B7280" }}>{p.sous}</span>
            </span>
            <ChevronRight className="w-5 h-5 shrink-0" style={{ color: CARBON }} />
          </Bouton>
        </li>
      ))}
    </ul>
  );

  // 5 · Vitre : les mêmes boutons en verre dépoli, posés sur le wallpaper, icône vert clair.
  return (
    <ul className="grid grid-cols-2 gap-1.5 max-w-lg">
      {list.map((p) => (
        <li key={p.label}>
          <Bouton p={p} className="w-full flex items-center gap-2.5 min-h-[56px] px-3.5 text-[15px] font-extrabold text-white backdrop-blur-md" style={{ fontFamily: FONT, background: "rgba(250,250,248,0.16)", clipPath: ch(10), boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)" }}>
            <p.icon className="w-5 h-5 shrink-0" style={{ color: SOFT }} />{p.label}
          </Bouton>
        </li>
      ))}
    </ul>
  );
};

export default PortesGarage;
