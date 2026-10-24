/**
 * Fiche trottinette complète (pilote SEO du 17/10/2026). Remplace le simple paragraphe « Présentation »
 * quand le modèle a une entrée dans src/data/scooterSeo.ts.
 * 17/10 (soir) : par défaut en ONGLETS « Tout savoir sur… » sous les pièces compatibles — Nolan : la fiche longue
 * repoussait les pièces. Tout le texte reste dans le DOM (onglets inactifs masqués par classe) : Google le lit.
 * ?fiche=long = ancienne version en sections empilées.
 * Sections : présentation (H2 avec le nom du modèle), fiche technique, points forts / limites,
 * pièces d'usure et tailles exactes (liens vers nos fiches pièces), entretien, prix / où l'acheter, FAQ, sources.
 */
import { useState } from "react";
import { PartnerBlockNew, achatParam, useBuyCtx } from "@/components/scooter/BuyProposals";
import { OfferComparator, comparoParam } from "@/components/scooter/OfferComparator";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, Minus, Play, ShieldCheck } from "lucide-react";
import { partnerOf } from "@/config/partners";
import type { ScooterSeo } from "@/data/scooterSeo";
import { laName } from "@/lib/article";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";

const Block = ({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="px-4 py-9 lg:px-8 scroll-mt-20" style={{ backgroundColor: "#FAFAF8" }}>
    <div className="mx-auto max-w-6xl grid lg:grid-cols-[260px_1fr] gap-3 lg:gap-10 border-t pt-7" style={{ borderColor: LINE }}>
      <h2 className="text-xl lg:text-2xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>{title}</h2>
      <div className="min-w-0">{children}</div>
    </div>
  </section>
);

type Mode = "tabs" | "long";

/** Vidéo légère : vignette + bouton lecture, l'iframe YouTube ne se charge qu'au clic (page rapide). */
const Video = ({ v, name }: { v: NonNullable<ScooterSeo["video"]>; name: string }) => {
  const [play, setPlay] = useState(false);
  return (
    <figure className="w-full">
      <div className="relative w-full aspect-video bg-[#1A1A1A] overflow-hidden" style={{ clipPath: CHAMFER }}>
        {play ? (
          <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
            title={v.title} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 w-full h-full" aria-label={`Lire la vidéo : ${v.title}`}>
            <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt={`Vidéo ${name}`} loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-16 h-16 rounded-full flex items-center justify-center bg-white/95 shadow-xl group-hover:scale-105 transition-transform">
                <Play className="w-7 h-7 ml-1" style={{ color: CARBON }} fill={CARBON} />
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-2 text-sm text-gray-500" style={{ fontFamily: FONT }}>Vidéo : {v.channel}</figcaption>
    </figure>
  );
};

/**
 * 19/10 : 5 propositions de vitrine partenaire derrière ?partenaire=1..5 (sans paramètre = carte actuelle,
 * rien ne change en prod). Méthode « cinq propositions rendues ». Les atouts viennent de src/config/partners.ts.
 */
type P = NonNullable<ReturnType<typeof partnerOf>>;
const variantParam = (): number => {
  if (typeof window === "undefined") return 0;
  // 19/10 (choix Nolan) : « Coupure pierre » (7) par défaut ; ?partenaire=0 = ancienne carte, 1..9 = propositions.
  const raw = new URLSearchParams(window.location.search).get("partenaire");
  if (raw === null) return 7;
  const n = Number(raw);
  return n >= 0 && n <= 9 ? n : 7;
};
const Legal = ({ dark = false }: { dark?: boolean }) => (
  <p className={`flex items-start gap-2 text-sm ${dark ? "text-white/60" : "text-gray-500"}`}>
    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
    <span>Lien partenaire : une petite commission pour nous, aucun surcoût pour toi.</span>
  </p>
);
const Cta = ({ url, p, light = false, full = false }: { url: string; p: P; light?: boolean; full?: boolean }) => (
  <a href={url} target="_blank" rel="sponsored noopener noreferrer"
    className={`inline-flex items-center justify-center gap-2 min-h-[52px] px-5 text-sm font-extrabold uppercase tracking-wider ${full ? "w-full" : "w-full lg:w-auto"}`}
    style={{ background: light ? "#FFFFFF" : CARBON, color: light ? CARBON : "#FFFFFF", clipPath: CHAMFER }}>
    <span className="lg:hidden">Voir chez {p.name}</span><span className="hidden lg:inline">Voir l'offre chez {p.name}</span> <ArrowRight className="w-4 h-4 shrink-0" />
  </a>
);
const Wordmark = ({ p, size = "text-3xl lg:text-4xl", color = CARBON }: { p: P; size?: string; color?: string }) => (
  <p className={`${size} uppercase leading-[0.95]`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color }}>{p.name}</p>
);

/** 1 · Repassé : la carte actuelle, même disposition, + accroche, atouts et sceau. */
const PartnerV1 = ({ url, name, p }: { url: string; name: string; p: P }) => (
  <div id="ou-acheter" className="mt-8 scroll-mt-24 bg-white p-5 lg:p-7" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
    <div className="grid lg:grid-cols-[1fr_auto] gap-4 lg:gap-8 items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>Où acheter {laName(name)}</p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[14px] font-extrabold uppercase tracking-wider text-white" style={{ background: GREEN }}>
            <Check className="w-3.5 h-3.5" /> Partenaire officiel
          </span>
        </div>
        <p className="mt-2 text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Notre partenaire : {p.name}</p>
        {p.tagline && <p className="mt-1 text-base font-semibold" style={{ color: CARBON }}>{p.tagline}</p>}
      </div>
      <Cta url={url} p={p} />
    </div>
    {p.perks && (
      <ul className="mt-5 grid sm:grid-cols-3 gap-3">
        {p.perks.map((k) => (
          <li key={k.title} className="flex items-start gap-2 p-3" style={{ background: "#F5F0E8" }}>
            <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GREEN }} />
            <span className="text-sm text-[#374151]"><b className="block text-base" style={{ color: CARBON }}>{k.title}</b>{k.text}</span>
          </li>
        ))}
      </ul>
    )}
    <div className="mt-4"><Legal /></div>
  </div>
);

/** 2 · Vitrine carbone : fond carbone, nom en grand, atouts en colonnes, bouton blanc. */
const PartnerV2 = ({ url, name, p }: { url: string; name: string; p: P }) => (
  <div id="ou-acheter" className="mt-8 scroll-mt-24 p-6 lg:p-9 text-white" style={{ background: CARBON, clipPath: CHAMFER, fontFamily: FONT }}>
    <p className="text-sm font-extrabold uppercase tracking-[0.18em]" style={{ color: "#8FC29F" }}>Partenaire officiel · Où acheter {laName(name)}</p>
    <div className="mt-3 grid lg:grid-cols-[1fr_auto] gap-5 lg:gap-10 items-end">
      <div>
        <Wordmark p={p} size="text-4xl lg:text-6xl" color="#FFFFFF" />
        {p.tagline && <p className="mt-3 text-lg text-white/80">{p.tagline}</p>}
      </div>
      <Cta url={url} p={p} light />
    </div>
    {p.perks && (
      <ul className="mt-7 grid sm:grid-cols-3 border-t border-white/15">
        {p.perks.map((k, i) => (
          <li key={k.title} className={`pt-5 sm:pr-5 pb-1 ${i > 0 ? "sm:pl-5 sm:border-l border-white/15" : ""}`}>
            <p className="text-sm font-extrabold uppercase tracking-wider" style={{ color: "#8FC29F" }}>{k.title}</p>
            <p className="mt-1 text-base text-white/85">{k.text}</p>
          </li>
        ))}
      </ul>
    )}
    <div className="mt-6"><Legal dark /></div>
  </div>
);

/** 3 · Recommandé par l'atelier : bandeau vert en tête, pourquoi à gauche, liste cochée à droite. */
const PartnerV3 = ({ url, name, p }: { url: string; name: string; p: P }) => (
  <div id="ou-acheter" className="mt-8 scroll-mt-24 bg-white" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
    <div className="flex items-center gap-2 px-5 lg:px-7 min-h-[44px] text-white text-sm font-extrabold uppercase tracking-[0.16em]" style={{ background: GREEN }}>
      <ShieldCheck className="w-4 h-4" /> Recommandé par notre atelier
    </div>
    <div className="p-5 lg:p-7 grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10">
      <div>
        <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>Où acheter {laName(name)}</p>
        <Wordmark p={p} size="text-3xl lg:text-5xl" />
        <p className="mt-3 text-base text-[#374151] leading-relaxed max-w-xl">
          On vend les pièces, pas les trottinettes. Pour la machine, on t'envoie chez {p.name}{p.tagline ? ` : ${p.tagline.charAt(0).toLowerCase()}${p.tagline.slice(1)}` : ""}.
        </p>
        <div className="mt-5"><Cta url={url} p={p} /></div>
      </div>
      {p.perks && (
        <ul className="space-y-3 lg:border-l lg:pl-8" style={{ borderColor: LINE }}>
          {p.perks.map((k) => (
            <li key={k.title} className="flex items-start gap-3">
              <span className="w-8 h-8 shrink-0 flex items-center justify-center" style={{ background: "#EAF2EC" }}><Check className="w-4 h-4" style={{ color: GREEN }} /></span>
              <span className="text-base text-[#374151]"><b style={{ color: CARBON }}>{k.title}.</b> {k.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
    <div className="px-5 lg:px-7 pb-5"><Legal /></div>
  </div>
);

/** 4 · Duo : les deux marques côte à côte (« piecestrottinettes.fr × Dualtron Store »), atouts en tuiles. */
const PartnerV4 = ({ url, name, p }: { url: string; name: string; p: P }) => (
  <div id="ou-acheter" className="mt-8 scroll-mt-24 p-5 lg:p-8" style={{ background: "#F5F0E8", clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="text-lg lg:text-2xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: GREEN }}>piecestrottinettes.fr</span>
      <span className="text-2xl font-light text-gray-400">×</span>
      <span className="text-lg lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{p.name}</span>
    </div>
    <p className="mt-2 text-sm font-extrabold uppercase tracking-[0.16em] text-gray-500">Partenaires · Où acheter {laName(name)}</p>
    {p.perks && (
      <ul className="mt-5 grid sm:grid-cols-3 gap-3">
        {p.perks.map((k) => (
          <li key={k.title} className="bg-white p-4" style={{ clipPath: CHAMFER }}>
            <p className="text-xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{k.title}</p>
            <p className="mt-1 text-sm text-[#374151]">{k.text}</p>
          </li>
        ))}
      </ul>
    )}
    <div className="mt-5 grid lg:grid-cols-[1fr_auto] gap-4 items-center">
      <p className="text-base text-[#374151]">On vend les pièces, pas les trottinettes : pour la machine, on travaille avec {p.name}.</p>
      <Cta url={url} p={p} />
    </div>
    <div className="mt-3"><Legal /></div>
  </div>
);

/** 5 · Sceau : un tampon rond « Partenaire officiel » et une phrase d'accroche directe. */
const Seal = () => (
  <svg viewBox="0 0 120 120" className="w-20 h-20 lg:w-28 lg:h-28 shrink-0 -rotate-12" aria-hidden="true">
    <defs><path id="pt-seal-c" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs>
    <circle cx="60" cy="60" r="57" fill={GREEN} />
    <circle cx="60" cy="60" r="31" fill="none" stroke="#FFFFFF" strokeWidth="2" />
    <text fill="#FFFFFF" fontSize="10.5" fontWeight="800" style={{ fontFamily: FONT }}>
      <textPath href="#pt-seal-c" textLength="272" lengthAdjust="spacingAndGlyphs">PARTENAIRE OFFICIEL • PIECESTROTTINETTES •</textPath>
    </text>
    <path d="M47 61 l9 9 l17 -19" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PartnerV5 = ({ url, name, p }: { url: string; name: string; p: P }) => (
  <div id="ou-acheter" className="mt-8 scroll-mt-24 bg-white p-5 lg:p-8" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
    <div className="flex items-start gap-4 lg:gap-7">
      <Seal />
      <div className="min-w-0">
        <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>Où acheter {laName(name)}</p>
        <p className="mt-1 text-2xl lg:text-4xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Achète-la chez {p.name}</p>
        {p.tagline && <p className="mt-2 text-base font-semibold" style={{ color: CARBON }}>{p.tagline}</p>}
      </div>
    </div>
    {p.perks && (
      <p className="mt-5 text-base text-[#374151] leading-relaxed">
        {p.perks.map((k, i) => (
          <span key={k.title}>{i > 0 && <span className="mx-2 text-gray-300">/</span>}<b style={{ color: CARBON }}>{k.title}</b> · {k.text}</span>
        ))}
      </p>
    )}
    <div className="mt-5 flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between">
      <Legal />
      <Cta url={url} p={p} />
    </div>
  </div>
);

/* ─── 2e tour (19/10) : clair, AVEC le logo du partenaire, gabarit identique pour tous les partenaires ─── */
const PartnerLogo = ({ p, size = 96 }: { p: P; size?: number }) =>
  p.logo ? <img src={p.logo} alt={`Logo ${p.name}`} width={size} height={size} loading="lazy" className="shrink-0 object-contain" style={{ width: size, height: size }} />
    : <span className="shrink-0 flex items-center justify-center text-white font-black" style={{ width: size, height: size, background: GREEN }}>{p.name.slice(0, 2)}</span>;
const OfficialTag = () => (
  <span className="inline-flex items-center gap-1 px-2 min-h-[26px] text-[14px] font-extrabold uppercase tracking-wider text-white" style={{ background: GREEN }}>
    <Check className="w-3.5 h-3.5" /> Partenaire officiel
  </span>
);
const PerkChips = ({ p }: { p: P }) => p.perks ? (
  <ul className="grid sm:grid-cols-3 gap-2">
    {p.perks.map((k) => (
      <li key={k.title} className="flex items-start gap-2 p-3 bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
        <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: GREEN }} />
        <span className="text-sm text-[#374151]"><b className="block text-base" style={{ color: CARBON }}>{k.title}</b>{k.text}</span>
      </li>
    ))}
  </ul>
) : null;

/** 6 · Badge : carte blanche, logo à gauche, tampon « Partenaire officiel », atouts en dessous. */
const PartnerV6 = ({ url, name, p }: { url: string; name: string; p: P }) => (
  <div id="ou-acheter" className="mt-8 scroll-mt-24 bg-white p-5 lg:p-7" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
    <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>Où acheter {laName(name)}</p>
    <div className="mt-3 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <PartnerLogo p={p} size={88} />
        <div className="min-w-0">
          <OfficialTag />
          <p className="mt-1.5 text-2xl lg:text-3xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{p.name}</p>
          {p.tagline && <p className="text-base font-semibold" style={{ color: CARBON }}>{p.tagline}</p>}
        </div>
      </div>
      <Cta url={url} p={p} />
    </div>
    <div className="mt-5"><PerkChips p={p} /></div>
    <div className="mt-4"><Legal /></div>
  </div>
);

/** 7 · Coupure pierre : bande pleine largeur couleur pierre (la coupure sans noir), logo centré en grand. */
const PartnerV7 = ({ url, name, p }: { url: string; name: string; p: P }) => (
  <div id="ou-acheter" className="mt-10 scroll-mt-24 -mx-4 lg:mx-0 px-5 py-8 lg:px-10 lg:py-10 text-center" style={{ background: "#EDE6DA", fontFamily: FONT, clipPath: CHAMFER }}>
    <p className="text-sm font-extrabold uppercase tracking-[0.16em]" style={{ color: GREEN }}>Où acheter {laName(name)}</p>
    <div className="mt-4 flex justify-center"><PartnerLogo p={p} size={112} /></div>
    <div className="mt-3 flex justify-center"><OfficialTag /></div>
    <p className="mt-2 text-3xl lg:text-4xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{p.name}</p>
    {p.tagline && <p className="mt-1 text-base lg:text-lg font-semibold" style={{ color: CARBON }}>{p.tagline}</p>}
    <div className="mt-6 text-left max-w-4xl mx-auto"><PerkChips p={p} /></div>
    <div className="mt-6 flex justify-center"><div className="w-full sm:w-auto"><Cta url={url} p={p} /></div></div>
    <div className="mt-4 flex justify-center"><Legal /></div>
  </div>
);

/** 8 · Double : panneau gauche pierre avec le logo (toujours le même cadre pour chaque partenaire), contenu à droite. */
const PartnerV8 = ({ url, name, p }: { url: string; name: string; p: P }) => (
  <div id="ou-acheter" className="mt-8 scroll-mt-24 grid sm:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] bg-white" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
    <div className="flex flex-col items-center justify-center gap-3 p-5" style={{ background: "#EDE6DA" }}>
      <PartnerLogo p={p} size={120} />
      <OfficialTag />
    </div>
    <div className="p-5 lg:p-7">
      <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>Où acheter {laName(name)}</p>
      <p className="mt-1 text-2xl lg:text-3xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Notre partenaire : {p.name}</p>
      {p.tagline && <p className="mt-1 text-base font-semibold" style={{ color: CARBON }}>{p.tagline}</p>}
      {p.perks && (
        <ul className="mt-4 space-y-2">
          {p.perks.map((k) => (
            <li key={k.title} className="flex items-start gap-2 text-base text-[#374151]">
              <Check className="w-4 h-4 mt-1 shrink-0" style={{ color: GREEN }} /><span><b style={{ color: CARBON }}>{k.title}.</b> {k.text}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex flex-col items-stretch lg:items-start gap-3"><Cta url={url} p={p} /><Legal /></div>
    </div>
  </div>
);

/** 9 · Actuel + logo : la carte d'origine, logo à côté du titre, tampon, sans rien ajouter d'autre. */
const PartnerV9 = ({ url, name, p }: { url: string; name: string; p: P }) => (
  <div id="ou-acheter" className="mt-8 scroll-mt-24 bg-white p-5 lg:p-6 grid lg:grid-cols-[auto_1fr_auto] gap-4 lg:gap-6 items-center" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
    <PartnerLogo p={p} size={80} />
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>Où acheter {laName(name)}</p>
        <OfficialTag />
      </div>
      <p className="mt-1 text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Notre partenaire : {p.name}</p>
      <p className="mt-2 text-base text-[#374151] leading-relaxed max-w-2xl">{p.tagline ? `${p.tagline}. ` : ""}On vend les pièces, pas les trottinettes : pour la machine, on te conseille un vendeur que notre atelier connaît.</p>
      <div className="mt-2"><Legal /></div>
    </div>
    <Cta url={url} p={p} />
  </div>
);

/** « Où l'acheter » : le partenaire présenté comme un choix de l'atelier, lien partenaire assumé. */
export const PartnerBlock = ({ url, name }: { url: string; name: string }) => {
  const buy = useBuyCtx();
  const achat = achatParam();
  const p = partnerOf(url);
  if (!p) return null;
  // 24/10 : comparateur multi-offres (?comparo=1..5), lit scooter_offers ; sans paramètre : inchangé.
  const comparo = comparoParam();
  if (comparo) return <OfferComparator look={comparo} name={name} />;
  // 24/10 : propositions « Où l'acheter » (?achat=1..5).
  if (achat) return <PartnerBlockNew look={achat} url={url} name={name} price={buy.price} brandLogo={buy.brandLogo} />;
  const v = variantParam();
  if (v === 6) return <PartnerV6 url={url} name={name} p={p} />;
  if (v === 7) return <PartnerV7 url={url} name={name} p={p} />;
  if (v === 8) return <PartnerV8 url={url} name={name} p={p} />;
  if (v === 9) return <PartnerV9 url={url} name={name} p={p} />;
  if (v === 1) return <PartnerV1 url={url} name={name} p={p} />;
  if (v === 2) return <PartnerV2 url={url} name={name} p={p} />;
  if (v === 3) return <PartnerV3 url={url} name={name} p={p} />;
  if (v === 4) return <PartnerV4 url={url} name={name} p={p} />;
  if (v === 5) return <PartnerV5 url={url} name={name} p={p} />;
  return (
    <div id="ou-acheter" className="mt-8 scroll-mt-24 bg-white p-5 lg:p-6 grid lg:grid-cols-[1fr_auto] gap-4 lg:gap-8 items-center" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
      <div>
        <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>Où acheter {laName(name)}</p>
        <p className="mt-1 text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Notre partenaire : {p.name}</p>
        <p className="mt-2 text-base text-[#374151] leading-relaxed max-w-2xl">
          On vend les pièces, pas les trottinettes. Pour la machine, on te conseille un vendeur que notre atelier connaît.
        </p>
        <p className="mt-2 flex items-start gap-2 text-sm text-gray-500">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Lien partenaire : une petite commission pour nous, aucun surcoût pour toi.</span>
        </p>
      </div>
      <a href={url} target="_blank" rel="sponsored noopener noreferrer" data-placement="fiche" className="inline-flex items-center justify-center gap-2 min-h-[52px] px-6 text-sm font-extrabold uppercase tracking-wider text-white"
        style={{ background: CARBON, clipPath: CHAMFER }}>
        Voir l'offre chez {p.name} <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
};

const Tabs = ({ seo, affiliateLink }: { seo: ScooterSeo; affiliateLink?: string | null }) => {
  const name = seo.displayName;
  const hasPrice = !!seo.price;
  const tabs = [
    { k: "pres", label: "Présentation" },
    { k: "tech", label: "Fiche technique" },
    { k: "tailles", label: "Tailles d'usure" },
    { k: "avis", label: "Forts / limites" },
    { k: "entretien", label: "Entretien" },
    ...(hasPrice ? [{ k: "prix", label: "Prix" }] : []),
    { k: "faq", label: `FAQ (${seo.faq.length})` },
  ];
  const [tab, setTab] = useState("pres");
  const [open, setOpen] = useState<number | null>(0);
  const panel = (k: string) => (tab === k ? "" : "hidden");
  const h3 = "text-sm font-extrabold uppercase tracking-[0.14em] mb-3";
  return (
    <section id="tout-savoir" className="px-4 py-10 lg:px-8 scroll-mt-20" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="mx-auto max-w-6xl border-t pt-8" style={{ borderColor: LINE }}>
        <h2 className="text-2xl lg:text-3xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>
          Tout savoir sur {laName(name)}
        </h2>
        <div role="tablist" aria-label={`Tout savoir sur ${laName(name)}`} className="mt-5 -mx-4 px-4 lg:mx-0 lg:px-0 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {tabs.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} aria-controls={`ts-${t.k}`} onClick={() => setTab(t.k)}
              className="shrink-0 min-h-[44px] px-4 text-sm font-extrabold uppercase tracking-wider transition-colors"
              style={{ fontFamily: FONT, clipPath: CHAMFER, background: tab === t.k ? CARBON : "#fff", color: tab === t.k ? "#fff" : CARBON, boxShadow: tab === t.k ? "none" : `inset 0 0 0 1px ${LINE}` }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 min-h-[220px] max-w-5xl" style={{ fontFamily: FONT }}>
          <div id="ts-pres" role="tabpanel" className={panel("pres")}>
            <div className={seo.video ? "grid lg:grid-cols-[1fr_minmax(0,420px)] gap-6 lg:gap-10 items-start" : ""}>
              <div>
                <h3 className={h3} style={{ color: GREEN }}>{name} : présentation</h3>
                <div className="space-y-4 text-base md:text-lg text-[#374151] leading-relaxed">{seo.intro.map((p, i) => <p key={i}>{p}</p>)}</div>
              </div>
              {seo.video && <Video v={seo.video} name={name} />}
            </div>
          </div>

          <div id="ts-tech" role="tabpanel" className={panel("tech")}>
            <h3 className={h3} style={{ color: GREEN }}>Fiche technique {name}</h3>
            <dl className="grid sm:grid-cols-2 gap-x-10">
              {seo.specs.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 py-3 border-b" style={{ borderColor: LINE }}>
                  <dt className="text-sm uppercase tracking-wider text-gray-500 shrink-0">{k}</dt>
                  <dd className="text-base text-right" style={{ fontWeight: 700, color: CARBON }}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div id="ts-tailles" role="tabpanel" className={panel("tailles")}>
            <h3 className={h3} style={{ color: GREEN }}>Pièces d'usure et tailles exactes</h3>
            <div className="grid gap-2">
              {seo.parts.map((p) => (
                <Link key={p.label + p.size} to={p.to} className="flex items-center gap-4 min-h-[56px] pl-4 pr-3 py-2 bg-white"
                  style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
                  <span className="w-28 shrink-0 text-sm font-extrabold uppercase tracking-wide" style={{ color: CARBON }}>{p.label}</span>
                  <span className="flex-1 min-w-0 text-base text-[#374151]">{p.size}</span>
                  <span className="hidden sm:inline text-sm text-gray-500 shrink-0">{p.count} réf.</span>
                  <ArrowRight className="w-4 h-4 shrink-0" style={{ color: GREEN }} />
                </Link>
              ))}
            </div>
          </div>

          <div id="ts-avis" role="tabpanel" className={panel("avis")}>
            <div className="grid md:grid-cols-2 gap-4">
              {([["Points forts", seo.pros, true], ["Limites", seo.cons, false]] as const).map(([t, list, good]) => (
                <div key={t} className="bg-white p-5" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${good ? GREEN : CARBON}, inset 0 0 0 1px ${LINE}` }}>
                  <h3 className={h3} style={{ color: good ? GREEN : CARBON }}>{t}</h3>
                  <ul className="space-y-2.5">
                    {list.map((x) => (
                      <li key={x} className="flex gap-2.5 text-base text-[#374151] leading-snug">
                        {good ? <Check className="w-4 h-4 mt-1 shrink-0" style={{ color: GREEN }} strokeWidth={3} /> : <Minus className="w-4 h-4 mt-1 shrink-0 text-gray-500" strokeWidth={3} />}
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div id="ts-entretien" role="tabpanel" className={panel("entretien")}>
            <h3 className={h3} style={{ color: GREEN }}>Entretien de {laName(name)}</h3>
            <ul className="space-y-3">
              {seo.care.map((c) => (
                <li key={c} className="flex gap-3 text-base text-[#374151] leading-relaxed">
                  <span aria-hidden className="mt-2.5 w-2 h-2 shrink-0" style={{ background: GREEN }} /><span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {hasPrice && (
            <div id="ts-prix" role="tabpanel" className={`${panel("prix")} space-y-3`}>
              <h3 className={h3} style={{ color: GREEN }}>Prix et où l'acheter</h3>
              {seo.price && <p className="text-base text-[#374151]">{seo.price.text} <span className="text-sm text-gray-500">Source : {seo.price.source}.</span></p>}
            </div>
          )}

          <div id="ts-faq" role="tabpanel" className={`${panel("faq")} space-y-2`}>
            {seo.faq.map((it, i) => (
              <div key={it.q} className="bg-white" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full flex items-center gap-3 min-h-[56px] px-4 text-left">
                  <h3 className="flex-1 text-base font-bold" style={{ color: CARBON }}>{it.q}</h3>
                  <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
                </button>
                <p className={`px-4 pb-4 text-base text-[#374151] leading-relaxed ${open === i ? "" : "hidden"}`}>{it.a}</p>
              </div>
            ))}
          </div>
        </div>

        {affiliateLink && <PartnerBlock url={affiliateLink} name={name} />}

        {/* 18/10 (Nolan) : sources repliées — discrètes à l'écran, toujours dans la page pour Google. */}
        <details className="mt-6 text-sm text-gray-500" style={{ fontFamily: FONT }}>
          <summary className="cursor-pointer select-none inline-flex items-center min-h-[44px] underline-offset-2 hover:underline">Sources ({seo.sources.length})</summary>
          <ul className="mt-1 space-y-1">
            {seo.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">{s.label}</a></li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
};

const Long = ({ seo, affiliateLink }: { seo: ScooterSeo; affiliateLink?: string | null }) => {
  const [open, setOpen] = useState<number | null>(0);
  const name = seo.displayName;
  return (
    <>
      <Block id="presentation" title={`${name} : présentation`}>
        <div className="max-w-3xl space-y-4 text-base md:text-lg text-[#374151] leading-relaxed" style={{ fontFamily: FONT }}>
          {seo.intro.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </Block>

      <Block id="fiche-technique" title="Fiche technique">
        <dl className="grid sm:grid-cols-2 gap-x-10 max-w-4xl">
          {seo.specs.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-3 border-b" style={{ borderColor: LINE }}>
              <dt className="text-sm uppercase tracking-wider text-gray-500 shrink-0" style={{ fontFamily: FONT }}>{k}</dt>
              <dd className="text-base text-right" style={{ fontFamily: FONT, fontWeight: 700, color: CARBON }}>{v}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block id="pieces-usure" title="Pièces d'usure et tailles exactes">
        <p className="max-w-3xl text-base text-[#374151] mb-4" style={{ fontFamily: FONT }}>
          Les cotes à connaître avant de commander pour ta {name}. Chaque pièce listée est vérifiée sur sa cote de montage.
        </p>
        <div className="grid gap-2 max-w-4xl">
          {seo.parts.map((p) => (
            <Link key={p.label + p.size} to={p.to} className="group flex items-center gap-4 min-h-[60px] pl-4 pr-3 py-2 bg-white transition-transform hover:-translate-y-0.5"
              style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
              <span className="w-28 shrink-0 text-sm font-extrabold uppercase tracking-wide" style={{ fontFamily: FONT, color: CARBON }}>{p.label}</span>
              <span className="flex-1 min-w-0 text-base text-[#374151]" style={{ fontFamily: FONT }}>{p.size}</span>
              <span className="hidden sm:inline text-sm text-gray-500 shrink-0" style={{ fontFamily: FONT }}>{p.count} réf.</span>
              <span className="inline-flex items-center gap-1 text-sm font-extrabold uppercase shrink-0" style={{ fontFamily: FONT, color: GREEN }}>
                <span className="hidden md:inline">{p.cta}</span><ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </Block>

      <Block id="avis" title="Points forts et limites">
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
          {([["Points forts", seo.pros, true], ["Limites", seo.cons, false]] as const).map(([t, list, good]) => (
            <div key={t} className="bg-white p-5" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${good ? GREEN : CARBON}, inset 0 0 0 1px ${LINE}` }}>
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] mb-3" style={{ fontFamily: FONT, color: good ? GREEN : CARBON }}>{t}</h3>
              <ul className="space-y-2.5">
                {list.map((x) => (
                  <li key={x} className="flex gap-2.5 text-base text-[#374151] leading-snug" style={{ fontFamily: FONT }}>
                    {good ? <Check className="w-4 h-4 mt-1 shrink-0" style={{ color: GREEN }} strokeWidth={3} /> : <Minus className="w-4 h-4 mt-1 shrink-0 text-gray-500" strokeWidth={3} />}
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Block>

      <Block id="entretien" title="Entretien">
        <ul className="max-w-3xl space-y-3">
          {seo.care.map((c) => (
            <li key={c} className="flex gap-3 text-base text-[#374151] leading-relaxed" style={{ fontFamily: FONT }}>
              <span aria-hidden className="mt-2.5 w-2 h-2 shrink-0" style={{ background: GREEN }} />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Block>

      {(seo.price || affiliateLink) && (
        <Block id="prix" title="Prix et où l'acheter">
          <div className="max-w-3xl space-y-3" style={{ fontFamily: FONT }}>
            {seo.price && <p className="text-base text-[#374151]">{seo.price.text} <span className="text-sm text-gray-500">Source : {seo.price.source}.</span></p>}
            {affiliateLink && (
              <a href={affiliateLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex items-center gap-2 min-h-[48px] px-6 text-sm font-extrabold uppercase tracking-wider text-white"
                style={{ background: CARBON, clipPath: CHAMFER }}>
                Voir l'offre <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </Block>
      )}

      <Block id="faq" title="Questions fréquentes">
        <div className="space-y-2 max-w-3xl">
          {seo.faq.map((it, i) => (
            <div key={it.q} className="bg-white" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
              <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full flex items-center gap-3 min-h-[56px] px-4 text-left">
                <h3 className="flex-1 text-base font-bold" style={{ fontFamily: FONT, color: CARBON }}>{it.q}</h3>
                <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {/* Réponse toujours dans le DOM (lisible par Google), seulement masquée visuellement. */}
              <p className={`px-4 pb-4 text-base text-[#374151] leading-relaxed ${open === i ? "" : "hidden"}`} style={{ fontFamily: FONT }}>{it.a}</p>
            </div>
          ))}
        </div>
      </Block>

      <section className="px-4 pb-10 lg:px-8" style={{ backgroundColor: "#FAFAF8" }}>
        <div className="mx-auto max-w-6xl lg:pl-[300px]">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-gray-500 mb-2" style={{ fontFamily: FONT }}>Sources</p>
          <ul className="space-y-1">
            {seo.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-gray-600 underline min-h-[32px] inline-flex items-center" style={{ fontFamily: FONT }}>{s.label}</a></li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
};

const ScooterSeoFiche = ({ seo, affiliateLink, mode = "tabs" }: { name?: string; seo: ScooterSeo; affiliateLink?: string | null; mode?: Mode }) =>
  mode === "tabs" ? <Tabs seo={seo} affiliateLink={affiliateLink} /> : <Long seo={seo} affiliateLink={affiliateLink} />;

export default ScooterSeoFiche;
