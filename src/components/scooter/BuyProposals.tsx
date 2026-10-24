/* « Où l'acheter » (24/10/2026, demande de Nolan) : bouton du haut plus conséquent, prix « en ce moment »
   sur le lien, bloc partenaire et bouton « Voir l'offre » propres. Propositions derrière ?achat=1..5 ;
   sans paramètre : inchangé.
   Prix : affiché UNIQUEMENT s'il a été relevé il y a 7 jours ou moins (price_checked_at). Un prix plus vieux
   n'est pas « en ce moment » : on ne l'affiche pas. Logo : celui du partenaire, sinon, pour une boutique
   officielle de la marque, le logo de la marque ; sinon le nom seul (plus de carré « Te »). */
import { ArrowRight, Check, ExternalLink, ShieldCheck, Tag } from "lucide-react";
import { createContext, useContext } from "react";
import { partnerOf, type Partner } from "@/config/partners";
import { laName } from "@/lib/article";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const GREEN_D = "#3A6449";
const LINE = "#E7E1D6";
const STONE = "#EDE6DA";
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";
const CHAMFER_L = "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)";

/** Prix frais et logo de marque de la fiche ouverte, lus par le bloc partenaire sans traverser 4 composants. */
export const BuyCtx = createContext<{ price: number | null; brandLogo: string | null }>({ price: null, brandLogo: null });
export const useBuyCtx = () => useContext(BuyCtx);

export type BuyLook = 1 | 2 | 3 | 4 | 5;
// 24/10 (choix de Nolan) : « Ligne de comparateur » (4) par défaut ; ?achat=0 = ancienne carte, 1..5 = propositions.
export const achatParam = (): BuyLook | null => {
  if (typeof window === "undefined") return 4;
  const sp = new URLSearchParams(window.location.search);
  if (!sp.has("achat")) return 4;
  const n = Number(sp.get("achat"));
  return n >= 1 && n <= 5 ? (n as BuyLook) : null;
};

/** Bouton « Voir l'offre » (24/10) : Nolan trouve le vert + noir « particulier » → 5 peaux derrière ?offre=1..5. */
export type OfferSkin = 0 | 1 | 2 | 3 | 4 | 5;
// 24/10 (choix de Nolan, reco) : « Grand vert deux lignes » (4) par défaut ; ?offre=0 = ancien bouton carbone + vert.
export const offreParam = (): OfferSkin => {
  if (typeof window === "undefined") return 4;
  const sp = new URLSearchParams(window.location.search);
  if (!sp.has("offre")) return 4;
  const n = Number(sp.get("offre"));
  return (n >= 0 && n <= 5 ? n : 4) as OfferSkin;
};

/** Prix « en ce moment » : relevé il y a 7 jours ou moins, sinon null. */
export const livePrice = (price?: number | null, checkedAt?: string | null): number | null => {
  if (!price || price <= 0 || !checkedAt) return null;
  const age = (Date.now() - new Date(checkedAt).getTime()) / 86_400_000;
  return age <= 7 ? price : null;
};
const eur = (n: number) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n).replace(/\s/g, "\u00a0")}\u00a0€`;

type P = Partner & { host: string };
const isOfficial = (p: P) => (p.tagline ?? "").toLowerCase().includes("officielle");
export const partnerLogo = (p: P, brandLogo?: string | null) => p.logo ?? (isOfficial(p) ? brandLogo ?? null : null);

const goBlock = (e: React.MouseEvent) => {
  const el = document.getElementById("ou-acheter");
  if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
};
const Legal = ({ dark = false }: { dark?: boolean }) => (
  <p className={`flex items-start gap-2 text-sm ${dark ? "text-white/60" : "text-gray-500"}`}>
    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
    <span>Lien partenaire : une petite commission pour nous, aucun surcoût pour toi.</span>
  </p>
);
const Logo = ({ src, p, size }: { src: string | null; p: P; size: number }) => src
  ? <span className="shrink-0 flex items-center justify-center bg-white" style={{ width: size, height: size, clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
      <img src={src} alt={`Logo ${p.name}`} className="object-contain" style={{ width: size * 0.72, height: size * 0.72 }} />
    </span>
  : null;
const Official = ({ p, dark = false }: { p: P; dark?: boolean }) => isOfficial(p) ? (
  <span className="inline-flex items-center gap-1 px-2 min-h-[28px] text-sm font-extrabold uppercase tracking-wider"
    style={{ background: dark ? "rgba(255,255,255,0.12)" : "rgba(74,124,89,0.12)", color: dark ? "#fff" : GREEN }}>
    <Check className="w-3.5 h-3.5" /> Boutique officielle
  </span>
) : null;

/** Le bouton « Voir l'offre » : grand, angle coupé, deux lignes (action + boutique), prix à droite s'il est frais. */
const OfferButton = ({ url, p, price, tone = "carbon", full = false }: { url: string; p: P; price: number | null; tone?: "carbon" | "green" | "white"; full?: boolean }) => {
  const skin = offreParam();
  if (skin) return <OfferSkinButton skin={skin} url={url} p={p} price={price} full={full} />;
  const bg = tone === "green" ? GREEN : tone === "white" ? "#fff" : CARBON;
  const fg = tone === "white" ? CARBON : "#fff";
  return (
    <a href={url} target="_blank" rel="sponsored noopener noreferrer" data-placement="fiche"
      className={`group inline-flex items-stretch min-h-[64px] ${full ? "w-full" : "w-full sm:w-auto"} transition-transform hover:-translate-y-0.5`}
      style={{ background: bg, color: fg, clipPath: CHAMFER_L, fontFamily: FONT }}>
      <span className="flex-1 flex flex-col justify-center px-5 py-2 text-left">
        <span className="text-base font-extrabold uppercase tracking-wider leading-tight whitespace-nowrap">Voir l'offre</span>
        <span className="text-sm font-semibold opacity-80 leading-tight whitespace-nowrap">chez {p.name}</span>
      </span>
      {price != null && (
        <span className="flex flex-col justify-center px-4 text-right" style={{ background: tone === "white" ? STONE : "rgba(255,255,255,0.12)" }}>
          <span className="text-sm opacity-80 leading-tight">en ce moment</span>
          <span className="text-xl leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{eur(price)}</span>
        </span>
      )}
      <span className="flex items-center justify-center w-14 pr-1" style={{ background: tone === "white" ? CARBON : tone === "green" ? GREEN_D : GREEN, color: "#fff" }}>
        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </a>
  );
};


/** Les 5 peaux du bouton « Voir l'offre ». Une seule couleur par bouton (fini le vert + noir), prix intégré au texte. */
const OfferSkinButton = ({ skin, url, p, price, full, hero = false }: { skin: OfferSkin; url: string; p: P; price: number | null; full: boolean; hero?: boolean }) => {
  const w = full ? "w-full" : "w-full sm:w-auto";
  // En haut de fiche, le même bouton descend vers le bloc « Où acheter » au lieu de sortir du site.
  const common = (hero ? { href: "#ou-acheter", onClick: goBlock } : { href: url, target: "_blank", rel: "sponsored noopener noreferrer", "data-placement": "fiche" }) as React.AnchorHTMLAttributes<HTMLAnchorElement>;
  const L1 = hero ? "Où l'acheter" : "Voir l'offre";
  const priceTxt = price != null ? eur(price) : null;
  // 1 · Plein vert : un seul aplat vert maison, texte blanc, prix séparé par un filet.
  if (skin === 1) return (
    <a {...common} className={`group inline-flex items-center gap-4 min-h-[60px] px-6 ${w} text-white bg-[#4A7C59] hover:bg-[#3A6449] transition-colors`} style={{ clipPath: CHAMFER_L, fontFamily: FONT }}>
      <span className="flex-1 text-base font-extrabold uppercase tracking-wider leading-tight sm:whitespace-nowrap">{L1} chez {p.name}</span>
      {priceTxt && <span className="pl-4 border-l border-white/40 text-lg whitespace-nowrap" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{priceTxt}</span>}
      <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" />
    </a>
  );
  // 2 · Carbone uni : noir plein, flèche dans un rond blanc.
  if (skin === 2) return (
    <a {...common} className={`group inline-flex items-center gap-4 min-h-[60px] pl-6 pr-3 ${w} text-white bg-[#1A1A1A] hover:bg-black transition-colors`} style={{ clipPath: CHAMFER_L, fontFamily: FONT }}>
      <span className="flex-1 min-w-0">
        <span className="block text-base font-extrabold uppercase tracking-wider whitespace-nowrap">{L1}</span>
        <span className="block text-sm text-white/70 whitespace-nowrap">chez {p.name}{priceTxt ? ` · ${priceTxt}` : ""}</span>
      </span>
      <span className="w-10 h-10 rounded-full bg-white text-[#1A1A1A] flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5"><ArrowRight className="w-5 h-5" /></span>
    </a>
  );
  // 3 · Biseau course : penché comme « Pièces compatibles » en haut de fiche, ombre carbone décalée.
  if (skin === 3) return (
    <a {...common} className={`group inline-flex items-center justify-center gap-3 min-h-[56px] px-7 ${w} text-white -skew-x-12 transition-transform hover:-translate-y-0.5`} style={{ background: GREEN, borderRadius: 4, boxShadow: `5px 5px 0 ${CARBON}`, fontFamily: UNB, fontWeight: 700, fontStyle: "italic" }}>
      <span className="skew-x-12 inline-flex items-center gap-3 text-sm uppercase tracking-[0.1em] whitespace-nowrap">
        {L1}{priceTxt ? ` · ${priceTxt}` : ""} <ArrowRight className="w-5 h-5" />
      </span>
    </a>
  );
  // 4 · Grand vert deux lignes : action en gros, boutique dessous, prix à droite, un seul vert.
  if (skin === 4) return (
    <a {...common} className={`group inline-flex items-center gap-4 min-h-[68px] px-6 ${w} text-white bg-[#4A7C59] hover:bg-[#3A6449] transition-colors`} style={{ clipPath: CHAMFER_L, fontFamily: FONT }}>
      <span className="flex-1 min-w-0">
        <span className="block text-lg font-extrabold uppercase tracking-wider leading-tight whitespace-nowrap">{L1}</span>
        <span className="block text-sm text-white/80 leading-tight whitespace-nowrap">chez {p.name}</span>
      </span>
      {priceTxt && <span className="text-2xl whitespace-nowrap" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{priceTxt}</span>}
      <ArrowRight className="w-6 h-6 shrink-0 transition-transform group-hover:translate-x-1" />
    </a>
  );
  // 5 · Contour : bordure carbone épaisse, se remplit au survol. Le plus sobre.
  return (
    <a {...common} className={`group inline-flex items-center gap-3 min-h-[60px] px-6 ${w} bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors`} style={{ boxShadow: `inset 0 0 0 2.5px ${CARBON}`, fontFamily: FONT }}>
      <span className="flex-1 text-base font-extrabold uppercase tracking-wider leading-tight sm:whitespace-nowrap">{L1} chez {p.name}</span>
      {priceTxt && <span className="text-lg whitespace-nowrap" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{priceTxt}</span>}
      <ArrowRight className="w-5 h-5 shrink-0" />
    </a>
  );
};

// ─── Bouton du haut (à côté de « Pièces compatibles ») ─────────────────────
export const BuyHeroButton = ({ look, url, price }: { look: BuyLook; url: string; price: number | null }) => {
  const p = partnerOf(url);
  const skin = offreParam();
  if (skin && p) return <div className="mt-3"><OfferSkinButton skin={skin} url={url} p={p} price={price} full={false} hero /></div>;
  const name = p?.name ?? "notre partenaire";
  const line2 = price != null ? `${eur(price)} chez ${name}` : `chez ${name}`;
  if (look === 3) {
    // Bandeau : une barre pleine largeur sous les boutons, contour vert.
    return (
      <a href="#ou-acheter" onClick={goBlock} className="mt-3 flex items-center gap-3 w-full min-h-[64px] px-4 bg-white"
        style={{ clipPath: CHAMFER_L, boxShadow: `inset 0 0 0 2px ${GREEN}`, fontFamily: FONT }}>
        <Tag className="w-5 h-5 shrink-0" style={{ color: GREEN }} />
        <span className="flex-1 min-w-0">
          <span className="block text-base font-extrabold uppercase tracking-wider leading-tight" style={{ color: CARBON }}>Où l'acheter en ce moment</span>
          <span className="block text-sm font-semibold text-gray-600 truncate">{line2}</span>
        </span>
        <ArrowRight className="w-5 h-5 shrink-0" style={{ color: GREEN }} />
      </a>
    );
  }
  const tone = look === 2 ? GREEN : CARBON;
  return (
    <a href="#ou-acheter" onClick={goBlock} className="mt-3 inline-flex items-stretch w-full sm:w-auto min-h-[64px] text-white transition-transform hover:-translate-y-0.5"
      style={{ background: tone, clipPath: CHAMFER_L, fontFamily: FONT }}>
      <span className="flex items-center justify-center w-14" style={{ background: look === 2 ? GREEN_D : GREEN }}><ExternalLink className="w-5 h-5" /></span>
      <span className="flex flex-col justify-center px-4 pr-7 py-2">
        <span className="text-base font-extrabold uppercase tracking-wider leading-tight">{look === 5 ? "Où l'acheter ?" : "Où l'acheter en ce moment"}</span>
        <span className="text-sm font-semibold opacity-85 leading-tight">{line2}</span>
      </span>
      {look === 4 && price != null && (
        <span className="flex items-center px-4 text-xl" style={{ background: "rgba(255,255,255,0.12)", fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{eur(price)}</span>
      )}
    </a>
  );
};

// ─── Bloc partenaire ───────────────────────────────────────────────────────
export const PartnerBlockNew = ({ look, url, name, price, brandLogo }: { look: BuyLook; url: string; name: string; price: number | null; brandLogo?: string | null }) => {
  const p = partnerOf(url);
  if (!p) return null;
  const logo = partnerLogo(p, brandLogo);
  const kicker = <p className="text-sm font-extrabold uppercase tracking-[0.16em]" style={{ color: GREEN }}>Où acheter {laName(name)}</p>;
  const perks = p.perks ? (
    <ul className="mt-4 grid sm:grid-cols-3 gap-2">
      {p.perks.map((k) => (
        <li key={k.title} className="flex items-start gap-2 text-sm text-[#374151]"><Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GREEN }} /><span><b style={{ color: CARBON }}>{k.title}.</b> {k.text}</span></li>
      ))}
    </ul>
  ) : null;

  // 1 · Repassé : la carte actuelle (pierre, centrée), vrai logo, gros bouton deux lignes avec le prix.
  if (look === 1) return (
    <div id="ou-acheter" className="mt-10 scroll-mt-24 -mx-4 lg:mx-0 px-5 py-8 lg:px-10 lg:py-10 text-center" style={{ background: STONE, fontFamily: FONT, clipPath: CHAMFER_L }}>
      {kicker}
      {logo && <div className="mt-4 flex justify-center"><Logo src={logo} p={p} size={96} /></div>}
      <p className="mt-3 text-3xl lg:text-4xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{p.name}</p>
      <div className="mt-2 flex justify-center"><Official p={p} /></div>
      {perks && <div className="text-left max-w-4xl mx-auto">{perks}</div>}
      <div className="mt-6 flex justify-center"><OfferButton url={url} p={p} price={price} /></div>
      <div className="mt-4 flex justify-center"><Legal /></div>
    </div>
  );

  // 2 · Ticket : à gauche la boutique, à droite le prix et le bouton, séparés par une ligne pointillée.
  if (look === 2) return (
    <div id="ou-acheter" className="mt-10 scroll-mt-24 grid lg:grid-cols-[1fr_auto] bg-white" style={{ clipPath: CHAMFER_L, boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
      <div className="p-5 lg:p-7 flex items-center gap-4">
        <Logo src={logo} p={p} size={80} />
        <div className="min-w-0">
          {kicker}
          <p className="mt-1 text-2xl lg:text-3xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{p.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2"><Official p={p} /></div>
        </div>
      </div>
      <div className="p-5 lg:p-7 flex flex-col justify-center gap-3 border-t-2 lg:border-t-0 lg:border-l-2 border-dashed" style={{ borderColor: LINE, background: "#FBF8F3" }}>
        {price != null
          ? <p className="text-sm uppercase tracking-wider text-gray-500">Prix en ce moment <span className="block text-4xl normal-case tracking-normal" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{eur(price)}</span></p>
          : <p className="text-sm uppercase tracking-wider text-gray-500">Prix et disponibilité<span className="block text-base normal-case tracking-normal font-bold" style={{ color: CARBON }}>sur la boutique, à jour</span></p>}
        <OfferButton url={url} p={p} price={null} tone="green" full />
        <Legal />
      </div>
    </div>
  );

  // 3 · Carte carbone : bloc sombre, logo sur pastille blanche, bouton blanc.
  if (look === 3) return (
    <div id="ou-acheter" className="mt-10 scroll-mt-24 -mx-4 lg:mx-0 px-5 py-8 lg:px-10 lg:py-9 text-white" style={{ background: CARBON, fontFamily: FONT, clipPath: CHAMFER_L }}>
      <div className="grid lg:grid-cols-[auto_1fr_auto] gap-5 lg:gap-8 items-center">
        <Logo src={logo} p={p} size={88} />
        <div className="min-w-0">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em]" style={{ color: "#9BC4A7" }}>Où acheter {laName(name)}</p>
          <p className="mt-1 text-2xl lg:text-3xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{p.name}</p>
          <div className="mt-2"><Official p={p} dark /></div>
        </div>
        <OfferButton url={url} p={p} price={price} tone="white" />
      </div>
      <div className="mt-5"><Legal dark /></div>
    </div>
  );

  // 4 · Ligne de comparateur : une ligne par boutique (une seule aujourd'hui), prête pour plusieurs vendeurs.
  if (look === 4) return (
    <div id="ou-acheter" className="mt-10 scroll-mt-24" style={{ fontFamily: FONT }}>
      <div className="flex items-end justify-between gap-3 mb-3">
        <h2 className="text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Où acheter {laName(name)}</h2>
        <span className="hidden sm:inline text-sm text-gray-500">Vendeurs que l'atelier connaît</span>
      </div>
      <div className="bg-white grid grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto_auto] gap-4 items-center p-4 lg:p-5" style={{ clipPath: CHAMFER_L, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
        <Logo src={logo} p={p} size={64} />
        <div className="min-w-0">
          <p className="text-lg font-extrabold uppercase leading-tight" style={{ color: CARBON }}>{p.name}</p>
          <div className="mt-1"><Official p={p} /></div>
        </div>
        <div className="col-span-2 lg:col-span-1 lg:text-right">
          {price != null ? <><span className="text-sm text-gray-500 block">en ce moment</span><span className="text-3xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{eur(price)}</span></>
            : <span className="text-sm text-gray-500">Prix à jour sur la boutique</span>}
        </div>
        <div className="col-span-2 lg:col-span-1"><OfferButton url={url} p={p} price={null} /></div>
      </div>
      <div className="mt-3"><Legal /></div>
    </div>
  );

  // 5 · Sobre : carte blanche, logo + nom + bouton, rien d'autre.
  return (
    <div id="ou-acheter" className="mt-10 scroll-mt-24 bg-white p-5 lg:p-7 grid lg:grid-cols-[1fr_auto] gap-5 items-center" style={{ clipPath: CHAMFER_L, boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
      <div className="flex items-center gap-4 min-w-0">
        <Logo src={logo} p={p} size={72} />
        <div className="min-w-0">
          {kicker}
          <p className="mt-1 text-2xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{p.name}</p>
          <div className="mt-2"><Legal /></div>
        </div>
      </div>
      <div className="w-full lg:w-auto"><OfferButton url={url} p={p} price={price} full /></div>
    </div>
  );
};
