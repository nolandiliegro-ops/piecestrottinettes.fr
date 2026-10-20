/**
 * Fiche produit — 5 compositions à comparer (17/10/2026, skill « cinq propositions rendues »).
 * Activées UNIQUEMENT par ?style=1..5 sur /piece/:slug : sans paramètre, la page en ligne ne change pas.
 *
 * Défaut corrigé dans les 5 : la compatibilité (ce qui fait acheter une pièce) était enterrée dans
 * une petite carte au milieu d'une grille de 4 cartes vitrées ; les caractéristiques étaient une liste
 * à puces dans un encadré bordé ; le bouton d'achat était un pavé noir générique. Ici : le nombre de
 * trottinettes compatibles et « ça va sur la mienne ? » dans le premier écran, caractéristiques en
 * tuiles, bouton d'achat orange (seul usage de l'orange), même famille visuelle que la fiche trottinette.
 *
 * 1 PIT-STAND   · calque de la fiche trottinette : photo + fiche, tuiles, boutons en biseau
 * 2 ÉTIQUETTE   · la taille / la cote en très grand, comme imprimée sur le flanc, bandeau carbone
 * 3 ATELIER     · sections numérotées 01 Compatibilité · 02 Caractéristiques · 03 Montage · 04 Présentation
 * 4 VITRINE     · grande photo centrée, prix sous le nom, barre d'achat collée en bas (mobile) / à droite (desktop)
 * 5 COMPAT D'ABORD · la question « ça va sur ma trottinette ? » avant tout le reste
 */
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingCart, Check, AlertCircle, Search, CheckCircle2, ChevronRight, Wrench, Clock, Package, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/formatPrice";
import { getAllImages } from "@/lib/entityImage";
import { optimizedImage } from "@/lib/imageTransform";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { SHOP_OPEN, openPrelaunch } from "@/config/launch";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import type { PartDetail, CompatibleScooter } from "@/hooks/usePartDetail";
import CompatibilityMatrix from "@/components/pdp/CompatibilityMatrix";
import RelatedProducts from "@/components/pdp/RelatedProducts";
import CompatCompact, { type CompatLook } from "@/components/pdp/CompatCompact";
import PartSeoFicheLooks, { type FicheLook } from "@/components/pdp/PartSeoFicheLooks";
import PartSeoFiche from "@/components/pdp/PartSeoFiche";

export type PartStyle = 1 | 2 | 3 | 4 | 5;
export const PART_STYLE_NAMES: Record<PartStyle, string> = { 1: "Pit-stand", 2: "Étiquette", 3: "Atelier", 4: "Vitrine", 5: "Compat d'abord" };

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const ORANGE = "#FF6600";
const LINE = "#ECE7DD";

type RelatedPart = { id: string; name: string; slug: string; price: number | null; image_url: string | null; stock_quantity: number | null };

interface Props {
  style: PartStyle;
  part: PartDetail;
  scooters: CompatibleScooter[];
  scootersLoading: boolean;
  related: RelatedPart[];
  relatedLoading: boolean;
  showTag?: boolean;
}

// ─── Données ────────────────────────────────────────────────────────────────
type Spec = { label: string; value: string };

const strip = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();

/**
 * Tuiles caractéristiques. Source 1 : la liste « Caractéristiques techniques » de la description
 * (« Diamètre : 140 mm » — format de toutes les fiches importées). Source 2 : le champ characteristics
 * (phrases ou lignes). L'EAN n'est pas une info client : écarté.
 */
export const parseSpecs = (description: string | null, raw: string | null): { tiles: Spec[]; free: string[] } => {
  const tiles: Spec[] = [];
  const free: string[] = [];
  const sec = (description ?? "").match(/<h2>\s*Caract[ée]ristiques[^<]*<\/h2>\s*<ul>([\s\S]*?)<\/ul>/i);
  if (sec) {
    for (const li of sec[1].match(/<li>([\s\S]*?)<\/li>/gi) ?? []) {
      const t = strip(li);
      const m = t.match(/^([^:]{2,40}?)\s*:\s*(.+)$/);
      if (m && !/^ean$/i.test(m[1].trim())) tiles.push({ label: m[1].trim(), value: m[2].trim() });
    }
  }
  if (tiles.length > 0) return { tiles, free };
  for (const item of (raw ?? "").split(/\n|;|\.\s+|,\s+(?=[A-ZÉ])/).map((s) => s.trim().replace(/\.$/, "")).filter(Boolean)) {
    const m = item.match(/^([^:]{2,40}?)\s*:\s*(.+)$/);
    if (m) tiles.push({ label: m[1].trim(), value: m[2].trim() });
    else free.push(item);
  }
  return { tiles, free };
};

/**
 * Description affichée sous « Présentation » : on retire le bloc « Compatibilité » générique
 * (« Aucune compatibilité spécifique… » contredit la liste réelle juste au-dessus) et la liste
 * des caractéristiques (déjà en tuiles).
 */
export const cleanDescription = (html: string) =>
  html
    .replace(/<h2>\s*Compatibilit[ée][^<]*<\/h2>\s*(<p>[\s\S]*?<\/p>\s*)+?(?=<h2|<h3|$)/i, "")
    .replace(/<h2>\s*Caract[ée]ristiques[^<]*<\/h2>\s*<ul>[\s\S]*?<\/ul>/i, "");

/** La cote qui identifie la pièce : « 10x2.50 », « 60/70-6.5 », « 140 mm », « 36V »… lue dans le nom. */
const keySize = (name: string): string | null => {
  const tire = name.match(/\b(\d{1,3}(?:[.,]\d+)?\s?[x×/]\s?\d{1,3}(?:[.,]\d+)?(?:\s?-\s?\d+(?:[.,]\d+)?)?)/i);
  if (tire) return tire[1].replace(/\s/g, "").replace("×", "x");
  const mm = name.match(/\b(\d{2,3})\s?mm\b/i);
  if (mm) return `${mm[1]} mm`;
  const v = name.match(/\b(\d{2})\s?V\b/);
  if (v) return `${v[1]} V`;
  return null;
};

const brandsOf = (list: CompatibleScooter[]) => {
  const m = new Map<string, number>();
  for (const s of list) {
    const b = s.brand?.name?.trim() || "Autres";
    m.set(b, (m.get(b) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

const plain = (html: string | null) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// ─── Achat (même logique que PurchaseBlock : boutique fermée → pré-lancement) ─
const useBuy = (part: PartDetail) => {
  const { addItem, setIsOpen } = useCart();
  const [busy, setBusy] = useState(false);
  const inStock = part.stock_quantity !== null && part.stock_quantity > 0;
  const buy = () => {
    if (!SHOP_OPEN) return openPrelaunch();
    if (!inStock || part.price === null || busy) return;
    setBusy(true);
    addItem({ id: part.id, name: part.name, price: part.price, image_url: part.image_url, stock_quantity: part.stock_quantity || 0 });
    toast.success(`${part.name} ajouté au panier`, { action: { label: "Voir le panier", onClick: () => setIsOpen(true) } });
    setTimeout(() => setBusy(false), 800);
  };
  const label = SHOP_OPEN ? (inStock ? "Ajouter au panier" : "Rupture de stock") : "Bientôt disponible";
  return { inStock, buy, busy, label, disabled: SHOP_OPEN && !inStock };
};

const BuyButton = ({ part, look = "slant", full = false }: { part: PartDetail; look?: "slant" | "block" | "pill"; full?: boolean }) => {
  const { buy, busy, label, disabled } = useBuy(part);
  const shape =
    look === "slant" ? { cls: "-skew-x-12 px-7", style: { borderRadius: 4, boxShadow: `4px 4px 0 ${CARBON}` }, inner: { transform: "skewX(12deg)" } }
    : look === "pill" ? { cls: "px-7", style: { borderRadius: 999 }, inner: {} }
    : { cls: "px-6", style: { borderRadius: 10 }, inner: {} };
  return (
    <button type="button" onClick={buy} disabled={disabled || busy}
      className={`inline-flex items-center justify-center min-h-[52px] text-sm uppercase tracking-[0.12em] text-white transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 ${shape.cls} ${full ? "w-full" : ""}`}
      style={{ ...shape.style, backgroundColor: ORANGE, fontFamily: UNB, fontWeight: 700, fontStyle: look === "slant" ? "italic" : "normal" }}>
      <span className="inline-flex items-center gap-2" style={shape.inner}><ShoppingCart className="w-4 h-4" strokeWidth={2.5} /> {label}</span>
    </button>
  );
};

const StockLine = ({ part }: { part: PartDetail }) => {
  const inStock = part.stock_quantity !== null && part.stock_quantity > 0;
  return inStock ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700" style={{ fontFamily: FONT }}><Check className="w-4 h-4" /> En stock</span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700" style={{ fontFamily: FONT }}><AlertCircle className="w-4 h-4" /> Rupture de stock</span>
  );
};

const Price = ({ value, size = "text-4xl", color = CARBON }: { value: number | null; size?: string; color?: string }) =>
  value === null ? null : <div className={size} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color, letterSpacing: "-0.02em" }}>{formatPrice(value)}</div>;

const Title = ({ name, size = "text-2xl lg:text-4xl", color = CARBON, italic = true }: { name: string; size?: string; color?: string; italic?: boolean }) => (
  <h1 className={`${size} uppercase leading-[1.05]`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: italic ? "italic" : "normal", letterSpacing: "-0.02em", color }}>{name}</h1>
);

const CatLabel = ({ part, color = GREEN }: { part: PartDetail; color?: string }) =>
  part.category?.name ? (
    <Link to={`/categorie/${part.category.slug}`} className="inline-flex items-center min-h-[32px] text-sm font-bold uppercase tracking-[0.18em] hover:underline" style={{ fontFamily: FONT, color }}>
      {part.category.name}{part.sku ? <span className="ml-2 font-semibold text-gray-400 tracking-wider">· {part.sku}</span> : null}
    </Link>
  ) : null;

// ─── Galerie ────────────────────────────────────────────────────────────────
const Photos = ({ part, height, thumbs = "row", bg = "#fff", rounded = "rounded-2xl" }: { part: PartDetail; height: string; thumbs?: "row" | "none"; bg?: string; rounded?: string }) => {
  const photos = getAllImages(part.images, part.image_url);
  const [i, setI] = useState(0);
  const cur = photos[i];
  return (
    <div>
      <div className={`${rounded} flex items-center justify-center overflow-hidden`} style={{ height, backgroundColor: bg }}>
        {cur ? <img src={optimizedImage(cur.url, 900)} alt={cur.alt || part.name} className="max-h-[88%] max-w-[88%] object-contain" decoding="async" />
          : <ImageOff className="w-12 h-12 text-gray-300" />}
      </div>
      {thumbs === "row" && photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {photos.map((p, k) => (
            <button key={p.url + k} type="button" onClick={() => setI(k)} aria-label={`Photo ${k + 1}`}
              className="flex-shrink-0 w-16 h-16 rounded-lg bg-white flex items-center justify-center border-2 transition-colors"
              style={{ borderColor: k === i ? CARBON : LINE }}>
              <img src={optimizedImage(p.url, 160)} alt="" className="max-w-[80%] max-h-[80%] object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 19/10 : tuiles à coin coupé (plus de coins ronds), comme le reste de la DA Atelier.
const TILE = { clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)", boxShadow: `inset 0 0 0 1px ${LINE}` } as const;

// ─── Tuiles caractéristiques ────────────────────────────────────────────────
const Tiles = ({ part, accent = GREEN, cols = "grid-cols-2 sm:grid-cols-3" }: { part: PartDetail; accent?: string; cols?: string }) => {
  const { tiles, free } = parseSpecs(part.description, part.characteristics);
  if (tiles.length === 0 && free.length === 0) return null;
  return (
    <div className={`grid ${cols} gap-2`}>
      {tiles.map((s) => (
        <div key={s.label} className="bg-white px-3 py-2.5 relative overflow-hidden" style={TILE}>
          <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accent }} />
          <div className="text-sm uppercase tracking-wider text-gray-500" style={{ fontFamily: FONT }}>{s.label}</div>
          <div className="text-base" style={{ fontFamily: UNB, fontWeight: 800, fontStyle: "italic", color: CARBON }}>{s.value}</div>
        </div>
      ))}
      {free.map((s) => (
        <div key={s} className="bg-white px-3 py-2.5 relative overflow-hidden flex items-center" style={TILE}>
          <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accent }} />
          <div className="text-sm font-semibold" style={{ fontFamily: FONT, color: CARBON }}>{s}</div>
        </div>
      ))}
    </div>
  );
};

// ─── Compatibilité : chiffre + « ça va sur la mienne ? » ────────────────────
const scrollToCompat = () => document.getElementById("pdp-compat")?.scrollIntoView({ behavior: "smooth", block: "start" });

const CompatCheck = ({ scooters, dark = false, big = false }: { scooters: CompatibleScooter[]; dark?: boolean; big?: boolean }) => {
  const { selectedScooter } = useSelectedScooter();
  const [q, setQ] = useState("");
  // Le chiffre affiché = compatibilités prouvées (✅) ; les « à vérifier » (🟡) sont dites à part, jamais gonflées.
  const verified = useMemo(() => scooters.filter((s) => s.status === "verified"), [scooters]);
  const toCheck = scooters.length - verified.length;
  const brands = useMemo(() => brandsOf(verified.length > 0 ? verified : scooters), [verified, scooters]);
  const mine = selectedScooter ? scooters.find((s) => s.id === selectedScooter.id) : null;
  const nq = q.trim().toLowerCase();
  const hits = nq.length >= 2 ? scooters.filter((s) => `${s.brand?.name ?? ""} ${s.name}`.toLowerCase().includes(nq)).slice(0, 4) : [];
  const fg = dark ? "#fff" : CARBON;
  const sub = dark ? "rgba(255,255,255,0.65)" : "#6B7280";
  return (
    <div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className={big ? "text-5xl lg:text-6xl" : "text-3xl"} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: dark ? "#fff" : GREEN, letterSpacing: "-0.03em" }}>{verified.length}</span>
        <span className="text-base font-bold uppercase tracking-wider" style={{ fontFamily: FONT, color: fg }}>trottinette{verified.length > 1 ? "s" : ""} compatible{verified.length > 1 ? "s" : ""}</span>
        {toCheck > 0 && <span className="text-sm" style={{ fontFamily: FONT, color: sub }}>+ {toCheck} à vérifier</span>}
      </div>
      {brands.length > 0 && (
        <p className="mt-1 text-sm" style={{ fontFamily: FONT, color: sub }}>
          {brands.slice(0, 5).map(([b, n]) => `${b} (${n})`).join(" · ")}{brands.length > 5 ? ` · +${brands.length - 5} marques` : ""}
        </p>
      )}
      {mine ? (
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 min-h-[44px] text-sm font-bold" style={{ backgroundColor: "rgba(74,124,89,0.14)", color: dark ? "#fff" : GREEN, fontFamily: FONT }}>
          <CheckCircle2 className="w-4 h-4" /> Va sur ta {selectedScooter?.brandName} {selectedScooter?.name}
        </div>
      ) : (
        <label className="mt-3 relative block max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: sub }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ta trottinette ? ex. Xiaomi 4 Pro"
            aria-label="Vérifier la compatibilité avec ta trottinette"
            className="w-full min-h-[44px] pl-9 pr-3 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-green-600"
            style={{ backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#fff", borderColor: dark ? "rgba(255,255,255,0.2)" : "#D1D5DB", color: fg, fontFamily: FONT }} />
        </label>
      )}
      {nq.length >= 2 && (
        <div className="mt-2 max-w-md space-y-1">
          {hits.length > 0 ? hits.map((s) => (
            <Link key={s.id} to={`/scooter/${s.slug}`} className="flex items-center gap-2 min-h-[44px] px-3 rounded-lg text-sm font-semibold" style={{ backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#fff", color: fg, fontFamily: FONT, border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : LINE}` }}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: dark ? "#9FD3AE" : GREEN }} /> {s.brand?.name} {s.name} — compatible
            </Link>
          )) : (
            <p className="text-sm px-1" style={{ color: sub, fontFamily: FONT }}>Pas dans notre liste. <button type="button" onClick={scrollToCompat} className="underline font-semibold min-h-[44px]" style={{ color: fg }}>Demande-nous</button>, on vérifie pour toi.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Blocs de bas de page ───────────────────────────────────────────────────
const Rule = ({ title, num, children, bg = "#FAFAF8", id }: { title: string; num?: string; children: React.ReactNode; bg?: string; id?: string }) => (
  <section id={id} className="px-4 py-8 scroll-mt-24" style={{ backgroundColor: bg }}>
    <div className="mx-auto max-w-6xl grid lg:grid-cols-[260px_1fr] gap-3 lg:gap-10 border-t-2 pt-6" style={{ borderColor: CARBON }}>
      <h2 className="text-xl lg:text-2xl uppercase flex items-baseline gap-3" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>
        {num && <span style={{ color: GREEN }}>{num}</span>}{title}
      </h2>
      <div className="min-w-0">{children}</div>
    </div>
  </section>
);

const Description = ({ part }: { part: PartDetail }) =>
  part.description?.trim() ? (
    <div className="quill-content max-w-3xl text-[#374151] text-base leading-[1.8]" style={{ fontFamily: FONT }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanDescription(part.description)) }} />
  ) : null;

const Install = ({ part }: { part: PartDetail }) => {
  const lvl = part.difficulty_level;
  const tools = part.required_tools ?? [];
  if (!lvl && !part.estimated_install_time_minutes && tools.length === 0) {
    return <p className="text-base text-gray-600" style={{ fontFamily: FONT }}>Montage en atelier ou chez toi : <Link to="/contact" className="font-semibold underline min-h-[44px] inline-flex items-center">demande-nous la marche à suivre</Link>.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {lvl ? <Mini icon={Wrench} label="Difficulté" value={`${lvl}/5`} /> : null}
      {part.estimated_install_time_minutes ? <Mini icon={Clock} label="Temps" value={`${part.estimated_install_time_minutes} min`} /> : null}
      {tools.length > 0 ? <Mini icon={Package} label="Outils" value={tools.join(", ")} /> : null}
    </div>
  );
};
const Mini = ({ icon: Icon, label, value }: { icon: typeof Wrench; label: string; value: string }) => (
  <div className="bg-white px-3 py-2.5" style={TILE}>
    <div className="flex items-center gap-1.5 text-sm uppercase tracking-wider text-gray-500" style={{ fontFamily: FONT }}><Icon className="w-4 h-4" />{label}</div>
    <div className="text-base" style={{ fontFamily: UNB, fontWeight: 800, fontStyle: "italic", color: CARBON }}>{value}</div>
  </div>
);

const CompatFull = (p: Props) => (
  <CompatibilityMatrix scooters={p.scooters} isLoading={p.scootersLoading} partSlug={p.part.slug} partName={p.part.name} partId={p.part.id} categorySlug={p.part.category?.slug ?? null} />
);

const Crumbs = ({ part, dark = false }: { part: PartDetail; dark?: boolean }) => (
  <nav aria-label="Fil d'ariane" className="mb-2">
    <ol className="flex items-center gap-1 text-sm flex-wrap" style={{ color: dark ? "rgba(255,255,255,0.6)" : "#6B7280", fontFamily: FONT }}>
      <li><Link to="/" className="inline-flex items-center min-h-[44px] hover:underline">Accueil</Link></li>
      <ChevronRight className="w-4 h-4" aria-hidden />
      <li><Link to="/catalogue" className="inline-flex items-center min-h-[44px] hover:underline">Catalogue</Link></li>
      {part.category?.slug && <><ChevronRight className="w-4 h-4" aria-hidden /><li><Link to={`/categorie/${part.category.slug}`} className="inline-flex items-center min-h-[44px] hover:underline font-semibold">{part.category.name}</Link></li></>}
    </ol>
  </nav>
);

const verifiedCount = (list: CompatibleScooter[]) => list.filter((s) => s.status === "verified").length;

const CompatIntro = ({ scooters }: { scooters: CompatibleScooter[] }) => {
  const n = verifiedCount(scooters);
  return (
    <p className="mb-4 max-w-3xl text-base text-[#374151] leading-relaxed" style={{ fontFamily: FONT }}>
      {n > 0
        ? <>Cette pièce va sur <strong>{n} trottinette{n > 1 ? "s" : ""}</strong>, vérifiées sur la cote de montage. Cherche ton modèle ou ouvre ta marque : si elle n'y est pas, écris-nous, on vérifie pour toi.</>
        : <>On n'a pas encore relié cette pièce à un modèle. Dis-nous ta trottinette, on vérifie pour toi.</>}
    </p>
  );
};

const Bottom = (p: Props & { numbered?: boolean; skipCompat?: boolean }) => {
  // 17/10 : bloc compat compact, 5 formes à comparer via &compat=1..5 (défaut 1 · Pastilles).
  const [sp] = useSearchParams();
  const cn = Number(sp.get("compat"));
  const look = (cn >= 1 && cn <= 5 ? cn : 1) as CompatLook;
  // Pneus pleins : on garde la matrice d'origine (état « ne passe pas en plein » lu sur la trotte du garage).
  const solid = p.part.category?.slug === "pneus-pleins";
  // 20/10 : fiche « Tout savoir » (compat entière dans le DOM + guide de famille), UNIQUEMENT avec ?seo=1 tant que Nolan n'a pas validé.
  if (sp.get("seo") === "1") {
    // 20/10 : Nolan a choisi la 4 (replié, compat en bas) = rendu par défaut sous ?seo=1.
    // &fiche=1..5 : les autres propositions ; &fiche=0 : l'ancien bloc à onglets.
    const fn = sp.has("fiche") ? Number(sp.get("fiche")) : 4;
    const fiche = (fn >= 1 && fn <= 5 ? fn : null) as FicheLook | null;
    return (
      <>
        {fiche ? <PartSeoFicheLooks look={fiche} tag={sp.has("fiche")} part={p.part} scooters={p.scooters} scootersLoading={p.scootersLoading} />
          : <PartSeoFiche part={p.part} scooters={p.scooters} scootersLoading={p.scootersLoading} />}
        <section className="px-4 py-8" style={{ backgroundColor: "#F5F0E8" }}>
          <div className="mx-auto max-w-6xl"><RelatedProducts parts={p.related} isLoading={p.relatedLoading} /></div>
        </section>
      </>
    );
  }
  return (
    <>
      {p.part.description?.trim() && <Rule title="Présentation"><Description part={p.part} /></Rule>}
      {!p.skipCompat && (
        <Rule id="pdp-compat" title="Compatibilité" num={p.numbered ? "01" : undefined}>
          <div className="max-w-2xl">
            {solid
              ? <><CompatIntro scooters={p.scooters} /><CompatibilityMatrix scooters={p.scooters} isLoading={p.scootersLoading} partSlug={p.part.slug} partName={p.part.name} partId={p.part.id} categorySlug="pneus-pleins" bare /></>
              : <CompatCompact look={look} scooters={p.scooters} partSlug={p.part.slug} partName={p.part.name} />}
          </div>
        </Rule>
      )}
      <section className="px-4 py-8" style={{ backgroundColor: "#F5F0E8" }}>
        <div className="mx-auto max-w-6xl"><RelatedProducts parts={p.related} isLoading={p.relatedLoading} /></div>
      </section>
    </>
  );
};

// ─── 1 · PIT-STAND ──────────────────────────────────────────────────────────
const PitStand = (p: Props) => (
  <>
    <section className="px-4 pt-20 lg:pt-24 pb-10" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="mx-auto max-w-6xl">
        <Crumbs part={p.part} />
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          <Photos part={p.part} height="clamp(260px, 38vw, 480px)" />
          <div>
            <CatLabel part={p.part} />
            <div className="mt-1"><Title name={p.part.name} /></div>
            <div className="mt-4 flex items-end gap-4 flex-wrap"><Price value={p.part.price} /><StockLine part={p.part} /></div>
            <div className="mt-5"><Tiles part={p.part} /></div>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <BuyButton part={p.part} />
              {verifiedCount(p.scooters) > 0 && (
                <button type="button" onClick={scrollToCompat} className="inline-flex items-center justify-center min-h-[52px] px-6 -skew-x-12 text-sm uppercase tracking-[0.12em] text-white" style={{ borderRadius: 4, backgroundColor: CARBON, fontFamily: UNB, fontWeight: 700, fontStyle: "italic" }}>
                  <span style={{ transform: "skewX(12deg)" }}>Compatible avec ma trott ?</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
    <Bottom {...p} />
  </>
);

// ─── 2 · ÉTIQUETTE ──────────────────────────────────────────────────────────
const Etiquette = (p: Props) => {
  const size = keySize(p.part.name);
  return (
    <>
      <section className="px-4 pt-20 lg:pt-24 pb-0 relative overflow-hidden" style={{ backgroundColor: CARBON }}>
        <div className="mx-auto max-w-6xl relative">
          <Crumbs part={p.part} dark />
          {size && (
            <div aria-hidden className="select-none leading-none whitespace-nowrap text-[22vw] lg:text-[190px] -mb-[3vw] lg:-mb-6"
              style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.04em", color: "transparent", WebkitTextStroke: "2px rgba(255,255,255,0.35)" }}>{size}</div>
          )}
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 items-end relative">
            <div className="pb-6">
              <CatLabel part={p.part} color="#9FD3AE" />
              <div className="mt-1"><Title name={p.part.name} color="#fff" /></div>
              <div className="mt-5"><CompatCheck scooters={p.scooters} dark big /></div>
            </div>
            <div className="lg:-mb-16 relative z-10"><Photos part={p.part} height="clamp(240px, 34vw, 420px)" thumbs="none" /></div>
          </div>
        </div>
      </section>
      <section className="px-4 pt-6 lg:pt-20 pb-8" style={{ backgroundColor: "#FAFAF8" }}>
        <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.1fr_1fr] gap-6">
          <div className="order-2 lg:order-1"><Tiles part={p.part} /></div>
          <div className="order-1 lg:order-2 rounded-2xl bg-white border p-5 flex flex-col gap-3" style={{ borderColor: LINE }}>
            <div className="flex items-end justify-between gap-3 flex-wrap"><Price value={p.part.price} /><StockLine part={p.part} /></div>
            <BuyButton part={p.part} look="block" full />
          </div>
        </div>
      </section>
      <Bottom {...p} />
    </>
  );
};

// ─── 3 · ATELIER ────────────────────────────────────────────────────────────
const Atelier = (p: Props) => (
  <>
    <section className="px-4 pt-20 lg:pt-24 pb-8" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="mx-auto max-w-6xl">
        <Crumbs part={p.part} />
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-6 lg:gap-10 items-center">
          <Photos part={p.part} height="clamp(240px, 32vw, 400px)" />
          <div>
            <CatLabel part={p.part} />
            <div className="mt-1"><Title name={p.part.name} /></div>
            <p className="mt-3 text-base text-gray-600 line-clamp-3" style={{ fontFamily: FONT }}>{plain(p.part.meta_description || p.part.description)}</p>
            <div className="mt-5 flex items-center gap-4 flex-wrap"><Price value={p.part.price} /><StockLine part={p.part} /></div>
            <div className="mt-5"><BuyButton part={p.part} /></div>
            <ol className="mt-6 grid grid-cols-2 gap-2" style={{ fontFamily: FONT }}>
              {[["01", `Compatibilité · ${p.scooters.filter((x) => x.status === "verified").length}`, "pdp-compat"], ["02", "Caractéristiques", "pdp-specs"], ["03", "Montage", "pdp-install"], ["04", "Présentation", "pdp-pres"]].map(([n, l, id]) => (
                <li key={n}><button type="button" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })} className="w-full text-left min-h-[44px] px-3 rounded-lg border bg-white text-sm font-bold uppercase tracking-wide hover:border-[#1A1A1A]" style={{ borderColor: LINE, color: CARBON }}>
                  <span style={{ color: GREEN, fontFamily: UNB, fontStyle: "italic" }}>{n}</span> {l}
                </button></li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
    <Rule id="pdp-compat" num="01" title="Compatibilité"><div className="mb-4"><CompatCheck scooters={p.scooters} /></div><CompatFull {...p} /></Rule>
    <Rule id="pdp-specs" num="02" title="Caractéristiques"><Tiles part={p.part} /></Rule>
    <Rule id="pdp-install" num="03" title="Montage"><Install part={p.part} /></Rule>
    {p.part.description?.trim() && <Rule id="pdp-pres" num="04" title="Présentation"><Description part={p.part} /></Rule>}
    <section className="px-4 py-8" style={{ backgroundColor: "#F5F0E8" }}><div className="mx-auto max-w-6xl"><RelatedProducts parts={p.related} isLoading={p.relatedLoading} /></div></section>
  </>
);

// ─── 4 · VITRINE ────────────────────────────────────────────────────────────
const Vitrine = (p: Props) => (
  <>
    <section className="px-4 pt-20 lg:pt-24 pb-10" style={{ backgroundColor: "#fff" }}>
      <div className="mx-auto max-w-6xl grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="text-center">
          <div className="text-left"><Crumbs part={p.part} /></div>
          <Photos part={p.part} height="clamp(300px, 46vw, 560px)" bg="#F7F5F0" rounded="rounded-3xl" />
          <div className="mt-6 lg:hidden">
            <CatLabel part={p.part} />
            <div className="mt-1"><Title name={p.part.name} size="text-2xl" italic={false} /></div>
            <div className="mt-3 flex justify-center items-center gap-3 flex-wrap"><Price value={p.part.price} size="text-3xl" /><StockLine part={p.part} /></div>
          </div>
          <div className="mt-6 text-left rounded-2xl border px-4 py-4 lg:hidden" style={{ borderColor: LINE }}><CompatCheck scooters={p.scooters} /></div>
          <div className="mt-6 text-left"><Tiles part={p.part} cols="grid-cols-2 sm:grid-cols-4" /></div>
        </div>
        <aside className="hidden lg:block sticky top-24 rounded-2xl border p-6" style={{ borderColor: LINE, backgroundColor: "#FAFAF8" }}>
          <CatLabel part={p.part} />
          <div className="mt-1"><Title name={p.part.name} size="text-2xl" italic={false} /></div>
          <div className="mt-4"><Price value={p.part.price} /></div>
          <div className="mt-2"><StockLine part={p.part} /></div>
          <div className="mt-5"><BuyButton part={p.part} look="pill" full /></div>
          <div className="mt-6 pt-5 border-t" style={{ borderColor: LINE }}><CompatCheck scooters={p.scooters} /></div>
        </aside>
      </div>
    </section>
    {/* Barre d'achat collée en bas (mobile), au-dessus de la barre de navigation */}
    <div className="lg:hidden fixed left-0 right-0 bottom-[72px] md:bottom-0 z-40 px-3 pb-2">
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur border shadow-lg px-3 py-2" style={{ borderColor: LINE }}>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate" style={{ fontFamily: FONT, color: CARBON }}>{p.part.name}</div>
          <Price value={p.part.price} size="text-lg" />
        </div>
        <BuyButton part={p.part} look="pill" />
      </div>
    </div>
    <Bottom {...p} />
    <div className="h-24 lg:hidden" aria-hidden />
  </>
);

// ─── 5 · COMPAT D'ABORD ─────────────────────────────────────────────────────
const CompatFirst = (p: Props) => (
  <>
    <section className="px-4 pt-20 lg:pt-24 pb-6" style={{ backgroundColor: GREEN }}>
      <div className="mx-auto max-w-6xl">
        <Crumbs part={p.part} dark />
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/70" style={{ fontFamily: FONT }}>Avant d'acheter</p>
        <h2 className="mt-1 text-2xl lg:text-4xl uppercase text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em" }}>Ça va sur ta trottinette ?</h2>
        <div className="mt-4"><CompatCheck scooters={p.scooters} dark /></div>
      </div>
    </section>
    <section className="px-4 py-8" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
        <Photos part={p.part} height="clamp(240px, 34vw, 440px)" />
        <div>
          <CatLabel part={p.part} />
          <div className="mt-1"><Title name={p.part.name} /></div>
          <div className="mt-4 flex items-end gap-4 flex-wrap"><Price value={p.part.price} /><StockLine part={p.part} /></div>
          <div className="mt-5"><BuyButton part={p.part} /></div>
          <div className="mt-6"><Tiles part={p.part} /></div>
        </div>
      </div>
    </section>
    <Bottom {...p} />
  </>
);

const PartPageVariants = (p: Props) => {
  const tag = p.showTag ? (
    <div className="fixed top-20 right-3 z-40 rounded-full px-3 py-1.5 text-sm font-bold text-white shadow" style={{ backgroundColor: CARBON, fontFamily: FONT }}>
      Proposition {p.style} · {PART_STYLE_NAMES[p.style]}
    </div>
  ) : null;
  const V = { 1: PitStand, 2: Etiquette, 3: Atelier, 4: Vitrine, 5: CompatFirst }[p.style];
  return <>{tag}<V {...p} /></>;
};

export default PartPageVariants;
