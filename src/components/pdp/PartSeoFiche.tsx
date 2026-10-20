/**
 * Fiche pièce « Tout savoir » (20/10/2026, chantier SEO pièces).
 * Défaut corrigé : le bloc compat compact ne mettait les noms de trottinettes dans la page qu'après un clic sur une
 * marque — Google ne voyait jamais « Xiaomi M365 » sur une fiche pièce. Ici TOUT le contenu est dans le DOM :
 * onglets inactifs masqués par classe, marques repliées en <details> (contenu lu par Google même fermé).
 *
 * Deux couches :
 *  1. Données LIVE (base) : compatibilités, cote, étrier, disque, tension/prise — jamais recopiées dans un texte,
 *     donc toujours à jour quand une compat est ajoutée.
 *  2. Guide de FAMILLE (public/fiches-pieces/<catégorie>.json, chargé à la demande) : bien choisir, montage, FAQ,
 *     sources. Un guide par famille, pas par référence : archiver une pièce ne périme rien.
 * Activé par ?seo=1 tant que Nolan n'a pas validé le rendu.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, CheckCircle2, HelpCircle, Search, Wrench, Clock, Package, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { formatPrice } from "@/lib/formatPrice";
import type { PartDetail, CompatibleScooter } from "@/hooks/usePartDetail";
import { parseSpecs, cleanDescription } from "@/components/pdp/PartPageVariants";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";

type Guide = {
  family: string;
  label: string;
  choose: { intro: string; steps: string[]; pitfalls: string[] };
  install: { level: string; time: string; tools: string[]; steps: string[] };
  pressure?: string;
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
};

const isGuide = (j: unknown): j is Guide => {
  const g = j as Guide;
  return !!g && typeof g.label === "string" && !!g.choose && Array.isArray(g.choose.steps) && !!g.install
    && Array.isArray(g.install.steps) && Array.isArray(g.faq) && Array.isArray(g.sources);
};

const useGuide = (family?: string | null) =>
  useQuery({
    queryKey: ["part-guide", family],
    enabled: !!family,
    staleTime: Infinity,
    retry: false,
    queryFn: async (): Promise<Guide | null> => {
      try {
        const r = await fetch(`/fiches-pieces/${encodeURIComponent(family as string)}.json`);
        // Une famille sans guide renvoie index.html (fallback SPA) : rejeté par le type de contenu.
        if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) return null;
        const j = await r.json();
        return isGuide(j) ? j : null;
      } catch {
        return null;
      }
    },
  }).data ?? null;

const useCaliperLabels = (enabled: boolean) =>
  useQuery({
    queryKey: ["caliper-labels"],
    enabled,
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase.from("fitment_caliper_families").select("code, label_client");
      return Object.fromEntries((data ?? []).map((r) => [r.code, r.label_client ?? r.code])) as Record<string, string>;
    },
  }).data ?? {};

// Tension de fin de charge = cellules lithium-ion en série × 4,2 V.
const CELLS: Record<number, number> = { 24: 7, 36: 10, 48: 13, 52: 14, 60: 16, 72: 20 };
const fr = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

const fullName = (s: CompatibleScooter) => {
  const b = s.brand?.name?.trim() ?? "";
  // « Pure Electric » + « Pure Air⁶ » : le nom commence déjà par le premier mot de la marque → pas de doublon.
  const first = b.split(/\s+/)[0]?.toLowerCase() ?? "";
  return b && !s.name.toLowerCase().startsWith(first) ? `${b} ${s.name}` : s.name;
};
const shortName = (s: CompatibleScooter) => {
  const b = s.brand?.name ?? "";
  return b && s.name.toLowerCase().startsWith(b.toLowerCase() + " ") ? s.name.slice(b.length + 1) : s.name;
};

type Group = { brand: string; items: CompatibleScooter[] };
const groupByBrand = (list: CompatibleScooter[]): Group[] => {
  const m = new Map<string, CompatibleScooter[]>();
  for (const s of list) {
    const b = s.brand?.name?.trim() || "Autres";
    m.set(b, [...(m.get(b) ?? []), s]);
  }
  return [...m.entries()]
    .map(([brand, items]) => ({ brand, items: items.sort((a, b) => a.name.localeCompare(b.name, "fr")) }))
    .sort((a, b) => b.items.length - a.items.length || a.brand.localeCompare(b.brand, "fr"));
};

/** Trois modèles représentatifs : le premier de chacune des plus grosses marques (pas trois Xiaomi d'affilée). */
const topModels = (groups: Group[], n = 3) => {
  const out: CompatibleScooter[] = [];
  for (let round = 0; out.length < n && round < 5; round++)
    for (const g of groups) if (g.items[round] && out.length < n) out.push(g.items[round]);
  return out.map(fullName);
};

const listFr = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;

/** Ce qui identifie la pièce, lu dans la base (jamais deviné). */
const keyRows = (part: PartDetail, caliper: Record<string, string>): [string, string][] => {
  const f = part.fitment_specs ?? {};
  const e = part.electrical_specs ?? {};
  const rows: [string, string][] = [];
  if (f.tire_sections?.length) rows.push(["Cotes de montage", f.tire_sections.join(" · ")]);
  if (f.rim_diameters?.length) rows.push(["Diamètre de jante", f.rim_diameters.map((d) => `${d.replace(".", ",")} pouces`).join(" · ")]);
  if (f.rim_widths?.length) rows.push(["Largeur de jante", f.rim_widths.join(" · ")]);
  if (f.tire_family === "solid") rows.push(["Type", "Pneu plein (increvable)"]);
  if (f.brake_caliper?.length) rows.push(["Étrier de frein", f.brake_caliper.map((c) => caliper[c] ?? c).join(" · ")]);
  const d = f.brake_disc;
  if (d?.diameters?.length) rows.push(["Diamètre du disque", d.diameters.map((x) => `${x} mm`).join(" · ")]);
  if (d?.holes?.length) rows.push(["Vis de fixation", d.holes.join(" · ")]);
  if (d?.pcds?.length) rows.push(["Entraxe de fixation", d.pcds.map((x) => `${x} mm`).join(" · ")]);
  for (const v of e.voltages ?? []) {
    rows.push(["Batterie", `${v} V nominal`]);
    if (CELLS[v]) rows.push(["Tension de fin de charge", `${fr(CELLS[v] * 4.2)} V (${CELLS[v]} cellules × 4,2 V)`]);
  }
  if (e.connector) rows.push(["Prise de charge", e.connector]);
  return rows;
};

/** Résumé court de la clé pour les phrases : « 10x2.50 », « étrier SRAM Avid », « 60 V, prise GX16-3 »… */
const keyPhrase = (part: PartDetail, caliper: Record<string, string>) => {
  const f = part.fitment_specs ?? {};
  const e = part.electrical_specs ?? {};
  if (f.tire_sections?.length) return `en ${f.tire_sections[0]}`;
  if (f.brake_caliper?.length) return `pour étrier ${caliper[f.brake_caliper[0]] ?? f.brake_caliper[0]}`;
  if (f.brake_disc?.diameters?.length) return `de ${f.brake_disc.diameters[0]} mm`;
  if (e.voltages?.length) return `${e.voltages[0]} V${e.connector ? `, prise ${e.connector}` : ""}`;
  return "";
};


/**
 * « Ce qui distingue cette référence » — 20/10 (Nolan : chaque pièce doit dire quelque chose de différent).
 * Tiré du nom et des attributs de LA pièce, jamais inventé : un trait non détecté n'est pas affiché.
 */
const traits = (part: PartDetail): string[] => {
  const n = part.name.toLowerCase();
  const cat = part.category?.slug ?? "";
  const out: string[] = [];
  if (cat === "chambres-a-air") {
    const angle = n.match(/valve\s+(?:coud[ée]e\s+)?(\d{1,3})\s?[x×]\s?(\d{1,3})\s?°/);
    if (/valve\s+droite/.test(n)) out.push("Valve droite : elle sort dans l'axe de la jante. À choisir quand rien ne gêne autour du trou de valve.");
    else if (angle) out.push(`Valve coudée ${angle[1]}°×${angle[2]}° : la tête de valve est déportée pour passer à côté du disque, du moteur ou de la fourche. Reprends l'angle de ta chambre d'origine.`);
    else if (/valve\s+coud[ée]e\s+(\d{1,3})\s?°/.test(n)) out.push(`Valve coudée à ${n.match(/valve\s+coud[ée]e\s+(\d{1,3})/)?.[1]}° : déportée pour rester accessible au gonfleur quand le disque ou le moteur gêne.`);
    else if (/valve\s+coud[ée]e/.test(n)) out.push("Valve coudée : déportée pour rester accessible au gonfleur quand le disque ou le moteur gêne.");
    if (/renforc|premium|[ée]paisse/.test(n)) out.push("Version renforcée : gomme plus épaisse, plus résistante aux pincements. Le bon choix si tu crèves souvent ou si tu roules chargé.");
    const jante = part.name.match(/jante\s+(\d{2,3})\s?mm/i);
    if (jante) out.push(`Prévue pour une jante de ${jante[1]} mm.`);
  }
  if (cat === "pneus" || cat === "pneus-pleins") {
    if (/tubeless/.test(n)) out.push("Tubeless : il se monte sans chambre à air, sur une jante étanche prévue pour. Une petite perforation se répare souvent avec une mèche.");
    else if (cat === "pneus") out.push("Pneu à chambre : il se monte avec une chambre à air de la même cote.");
    if (/gel|anti[- ]?crevaison/.test(n)) out.push("Avec gel anti-crevaison : il colmate les petites perforations, pas une coupure.");
    if (/semi[- ]?off/.test(n)) out.push("Gomme semi tout-terrain : roule bien sur le bitume et accroche mieux sur les chemins qu'un pneu route.");
    else if (/off[- ]?road|tout[- ]terrain|crampon/.test(n)) out.push("Gomme tout-terrain : crampons marqués pour accrocher sur terre et graviers ; un peu plus de bruit et de résistance sur route.");
    else if (/city ?road|route|street|urbain/.test(n)) out.push("Gomme route : profil lisse pour un roulement doux et silencieux sur le bitume.");
    if (/ultra[- ]?l[ée]ger/.test(n)) out.push("Version allégée : moins de masse en bout de roue qu'un pneu plein classique.");
    if (/alv[ée]ol|nid d.abeille|honeycomb/.test(n)) out.push("Structure alvéolée : fléchit davantage qu'un plein massif, donc un peu plus confortable.");
    const jante = part.name.match(/jante\s+(\d{2,3})\s?mm/i);
    if (jante) out.push(`Pour une jante de ${jante[1]} mm de large : mesure la tienne, c'est elle qui décide si ce plein se monte.`);
    if (cat === "pneus-pleins") out.push("Pneu plein : zéro crevaison et zéro gonflage, en échange d'un confort et d'une accroche sur sol mouillé moindres.");
  }
  if (cat === "plaquettes") {
    if (/fritt/.test(n)) out.push("Métal fritté : tient la chaleur des freinages répétés et l'humidité, dure plus longtemps ; un peu plus bruyant et plus dur pour le disque.");
    else if (/semi[- ]?m[ée]tal/.test(n)) out.push("Semi-métallique : compromis entre le mordant de l'organique et l'endurance du métal.");
    else if (/c[ée]ramique/.test(n)) out.push("Céramique : mélange résine et céramique, silencieux avec une meilleure tenue à la chaleur qu'une résine simple.");
    else if (/m[ée]tal/.test(n)) out.push("Métallique : endurant et efficace sous la pluie, un peu plus bruyant qu'une organique.");
    else if (/organi|r[ée]sine/.test(n)) out.push("Organique : mordant immédiat et silence, s'use plus vite qu'une métallique.");
    if (/ventil/.test(n)) out.push("Support ventilé : évacue mieux la chaleur lors des freinages appuyés.");
    if (/4 pistons/.test(n)) out.push("Pour étrier 4 pistons : plaquette plus longue, à ne pas confondre avec une 2 pistons.");
  }
  if (cat === "disques") {
    if (/flottant/.test(n)) out.push("Disque flottant : la piste est montée sur des rivets mobiles, il encaisse mieux la chaleur des freinages répétés.");
    else out.push("Disque fixe : rigide et simple, suffisant pour un usage urbain.");
    const coul = part.name.match(/\((vert|bleu|rouge|noir|or|violet)\)/i);
    if (coul) out.push(`Coloris ${coul[1].toLowerCase()} : la couleur ne change rien au freinage.`);
  }
  if (cat === "chargeurs") {
    const amp = part.name.match(/(\d+(?:[.,]\d+)?)\s?(?:-\s?(\d+(?:[.,]\d+)?))?\s?A\b/);
    const a = amp ? parseFloat((amp[2] ?? amp[1]).replace(",", ".")) : null;
    if (a) {
      const t = (ah: number) => fr(Math.round((ah / a) * 10) / 10);
      out.push(`${a} A${amp?.[2] ? " max (réglable)" : ""} : au moins ${t(15)} h pour une batterie de 15 Ah, ${t(30)} h pour 30 Ah (capacité ÷ ampérage), plus la fin de charge qui ralentit.`);
      if (a >= 5) out.push("Charge rapide : à réserver aux batteries qui l'acceptent, sinon elle accélère leur vieillissement.");
    }
    if (/pack|adaptateur/.test(n)) out.push("Livré avec adaptateur : le chargeur garde sa prise GX16 et l'adaptateur la convertit vers la prise de ta trottinette.");
  }
  return out;
};

type Sibling = { id: string; name: string; slug: string; price: number | null };
/** Variantes de la même cote / du même étrier / de la même tension : maillage interne propre à chaque fiche. */
const useSiblings = (part: PartDetail) => {
  const f = part.fitment_specs ?? {};
  const e = part.electrical_specs ?? {};
  const filter: { col: "fitment_specs" | "electrical_specs"; val: Record<string, unknown> } | null = f.tire_sections?.length ? { col: "fitment_specs", val: { tire_sections: [f.tire_sections[0]] } }
    : f.brake_caliper?.length ? { col: "fitment_specs", val: { brake_caliper: [f.brake_caliper[0]] } }
    : f.brake_disc?.diameters?.length ? { col: "fitment_specs", val: { brake_disc: { diameters: [f.brake_disc.diameters[0]] } } }
    : e.voltages?.length ? { col: "electrical_specs", val: { voltages: [e.voltages[0]] } }
    : null;
  return useQuery({
    queryKey: ["part-siblings", part.id],
    enabled: !!filter && !!part.category_id,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Sibling[]> => {
      const { data } = await supabase.from("parts").select("id, name, slug, price")
        .eq("published", true).eq("category_id", part.category_id as string).neq("id", part.id)
        .contains(filter!.col, filter!.val).order("price", { ascending: true }).limit(8);
      return (data ?? []) as Sibling[];
    },
  }).data ?? [];
};

const siblingTitle = (part: PartDetail) => {
  const f = part.fitment_specs ?? {};
  if (f.tire_sections?.length) return `Autres références en ${f.tire_sections[0]}`;
  if (f.brake_caliper?.length) return "Pour le même étrier";
  if (f.brake_disc?.diameters?.length) return `Autres disques de ${f.brake_disc.diameters[0]} mm`;
  return `Autres chargeurs ${part.electrical_specs?.voltages?.[0] ?? ""} V`;
};


/** Sur quoi la compatibilité est vérifiée, dit dans les mots de la famille. */
const matchBasis = (part: PartDetail) => {
  const f = part.fitment_specs ?? {};
  if (f.brake_caliper?.length) return "sur la forme d'étrier";
  if (f.brake_disc?.diameters?.length) return "sur le diamètre et la fixation du disque";
  if (part.electrical_specs?.voltages?.length) return part.electrical_specs.connector ? "sur la tension et la prise de charge" : "sur la tension";
  return "sur la cote de montage";
};

const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

const Video = ({ id, name }: { id: string; name: string }) => {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative w-full aspect-video bg-[#1A1A1A] overflow-hidden mt-5" style={{ clipPath: CHAMFER }}>
      {play ? (
        <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={`Montage ${name}`} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 w-full h-full" aria-label={`Lire la vidéo de montage : ${name}`}>
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={`Vidéo de montage ${name}`} loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-16 h-16 rounded-full flex items-center justify-center bg-white/95 shadow-xl"><Play className="w-7 h-7 ml-1" style={{ color: CARBON }} fill={CARBON} /></span>
          </span>
        </button>
      )}
    </div>
  );
};

const Chip = ({ s, check = false }: { s: CompatibleScooter; check?: boolean }) => (
  <Link to={`/scooter/${s.slug}`} className="relative inline-flex items-center min-h-[44px] pl-3.5 pr-3 text-sm font-semibold bg-white hover:-translate-y-0.5 transition-transform"
    style={{ color: CARBON, borderRadius: 4, boxShadow: `inset 3px 0 0 ${check ? "#D97706" : GREEN}, inset 0 0 0 1px ${LINE}` }}>
    {shortName(s)}
  </Link>
);

const BrandFold = ({ g, check = false }: { g: Group; check?: boolean }) => (
  <details className="group bg-white" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
    <summary className="list-none cursor-pointer flex items-center gap-3 min-h-[52px] px-4 select-none [&::-webkit-details-marker]:hidden">
      <h4 className="flex-1 text-sm font-extrabold uppercase tracking-wider" style={{ color: CARBON }}>{g.brand}</h4>
      <span className="text-base" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: check ? "#B45309" : GREEN }}>{g.items.length}</span>
      <ChevronDown className="w-5 h-5 shrink-0 transition-transform group-open:rotate-180" />
    </summary>
    <div className="px-3 pb-3 flex flex-wrap gap-1.5">{g.items.map((s) => <Chip key={s.id} s={s} check={check} />)}</div>
  </details>
);

const askUrl = (part: PartDetail, model?: string) => {
  const p = new URLSearchParams({ piece: part.slug, nom: part.name });
  if (model) p.set("modele", model);
  return `/contact?${p.toString()}`;
};

/** Tout ce que la fiche affiche, calculé une fois : partagé par l'actuelle et les 5 propositions (?fiche=1..5, 20/10). */
export const useFiche = (part: PartDetail, scooters: CompatibleScooter[]) => {
  const family = part.category?.slug ?? null;
  const guide = useGuide(family);
  const caliper = useCaliperLabels(!!part.fitment_specs?.brake_caliper?.length);
  const siblings = useSiblings(part);
  const points = traits(part);
  const [q, setQ] = useState("");
  const verified = useMemo(() => scooters.filter((s) => s.status === "verified"), [scooters]);
  const toCheck = useMemo(() => scooters.filter((s) => s.status !== "verified"), [scooters]);
  const groups = useMemo(() => groupByBrand(verified), [verified]);
  const checkGroups = useMemo(() => groupByBrand(toCheck), [toCheck]);
  const n = verified.length;
  const top = topModels(groups);
  const key = keyPhrase(part, caliper);
  const rows = keyRows(part, caliper);
  const { tiles, free } = parseSpecs(part.description, part.characteristics);
  const known = new Set(rows.map(([k]) => k.toLowerCase()));
  const extra = tiles.filter((t) => !known.has(t.label.toLowerCase())
    && !/^(type|dimension|taille|connecteur|prise|tension|voltage|[ée]trier|diam[eè]tre|entraxe|ean)\b/i.test(t.label));
  const specs: [string, string][] = [...rows, ...extra.map((t) => [t.label, t.value] as [string, string])];
  const desc = part.description?.trim() ? cleanDescription(part.description).replace(/<h2>[\s\S]*?<\/h2>/gi, "").trim() : "";
  const descText = desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const vars = { name: part.name, count: String(n), top1: top[0] ?? "ta trottinette", top3: listFr(top), size: key };
  const faq = (guide?.faq ?? [])
    .filter((f) => n > 0 || !/\{(top1|top3|count)\}/.test(f.q + f.a))
    .map((f) => ({ q: fill(f.q, vars), a: fill(f.a, vars) }));
  const nq = q.trim().toLowerCase();
  const hits = nq.length >= 2 ? scooters.filter((s) => fullName(s).toLowerCase().includes(nq)).slice(0, 5) : [];
  const guideLabel = guide ? `${guide.label} ${key}`.trim() : key;
  return { guide, siblings, points, q, setQ, nq, hits, verified, toCheck, groups, checkGroups, n, top, key, rows, specs, free, desc, descText, faq, guideLabel };
};
export type Fiche = ReturnType<typeof useFiche>;

export const FaqJsonLd = ({ faq }: { faq: { q: string; a: string }[] }) => faq.length > 0 ? (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      })}
    </script>
  </Helmet>
) : null;

export { UNB, FONT, CARBON, GREEN, LINE, CHAMFER, Video, Chip, BrandFold, askUrl, fullName, shortName, listFr, siblingTitle, matchBasis };
export type { Group, Guide, Sibling };

const PartSeoFiche = ({ part, scooters, scootersLoading }: { part: PartDetail; scooters: CompatibleScooter[]; scootersLoading: boolean }) => {
  const family = part.category?.slug ?? null;
  const guide = useGuide(family);
  const caliper = useCaliperLabels(!!part.fitment_specs?.brake_caliper?.length);
  const [tab, setTab] = useState("compat");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [q, setQ] = useState("");
  const siblings = useSiblings(part);
  const points = traits(part);

  const verified = useMemo(() => scooters.filter((s) => s.status === "verified"), [scooters]);
  const toCheck = useMemo(() => scooters.filter((s) => s.status !== "verified"), [scooters]);
  const groups = useMemo(() => groupByBrand(verified), [verified]);
  const checkGroups = useMemo(() => groupByBrand(toCheck), [toCheck]);
  const n = verified.length;
  const top = topModels(groups);
  const key = keyPhrase(part, caliper);
  const rows = keyRows(part, caliper);
  const { tiles, free } = parseSpecs(part.description, part.characteristics);
  const known = new Set(rows.map(([k]) => k.toLowerCase()));
  // Tuiles fournisseur déjà couvertes par les clés lues en base (prise, tension, cote, étrier…) : écartées, pas de doublon.
  const extra = tiles.filter((t) => !known.has(t.label.toLowerCase())
    && !/^(type|dimension|taille|connecteur|prise|tension|voltage|[ée]trier|diam[eè]tre|entraxe|ean)\b/i.test(t.label));
  const desc = part.description?.trim() ? cleanDescription(part.description).replace(/<h2>[\s\S]*?<\/h2>/gi, "").trim() : "";
  const descText = desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const vars = { name: part.name, count: String(n), top1: top[0] ?? "ta trottinette", top3: listFr(top), size: key };
  const faq = (guide?.faq ?? [])
    .filter((f) => n > 0 || !/\{(top1|top3|count)\}/.test(f.q + f.a))
    .map((f) => ({ q: fill(f.q, vars), a: fill(f.a, vars) }));

  const nq = q.trim().toLowerCase();
  const hits = nq.length >= 2 ? scooters.filter((s) => fullName(s).toLowerCase().includes(nq)).slice(0, 5) : [];

  const tabs = [
    { k: "compat", label: `Compatibilité${n ? ` (${n})` : ""}` },
    { k: "tech", label: "Caractéristiques" },
    ...(guide ? [{ k: "choisir", label: "Bien choisir" }, { k: "montage", label: "Montage" }] : []),
    ...(faq.length ? [{ k: "faq", label: `FAQ (${faq.length})` }] : []),
  ];
  const panel = (k: string) => (tab === k ? "" : "hidden");
  const h3 = "text-sm font-extrabold uppercase tracking-[0.14em] mb-3";
  const p = "text-base text-[#374151] leading-relaxed";

  return (
    <section id="pdp-compat" className="px-4 py-10 lg:px-8 scroll-mt-20" style={{ backgroundColor: "#FAFAF8" }}>
      {faq.length > 0 && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            })}
          </script>
        </Helmet>
      )}
      <div className="mx-auto max-w-6xl border-t-2 pt-8" style={{ borderColor: CARBON, fontFamily: FONT }}>
        <h2 className="text-2xl lg:text-3xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>
          Tout savoir sur cette pièce
        </h2>
        <p className={`mt-3 max-w-3xl ${p} md:text-lg`}>
          <strong style={{ color: CARBON }}>{part.name}</strong>
          {guide ? ` : ${guide.label} ${key}` : key ? ` : ${key}` : ""}.{" "}
          {scootersLoading ? null : n > 0
            ? <>Compatible avec <strong style={{ color: GREEN }}>{n} trottinette{n > 1 ? "s" : ""}</strong> vérifiée{n > 1 ? "s" : ""} {matchBasis(part)}, dont {listFr(top)}{groups.length > 3 ? `, sur ${groups.length} marques` : ""}.</>
            : <>Pas encore reliée à un modèle : dis-nous ta trottinette, on vérifie pour toi.</>}
        </p>

        {points.length > 0 && (
          <div className="mt-5 max-w-3xl bg-white p-4 lg:p-5" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
            <h3 className={h3} style={{ color: GREEN }}>Ce qui distingue cette référence</h3>
            <ul className="space-y-2">{points.map((x) => (
              <li key={x} className={`flex gap-3 ${p}`}><CheckCircle2 className="w-4 h-4 mt-1 shrink-0" style={{ color: GREEN }} /><span>{x}</span></li>
            ))}</ul>
          </div>
        )}

        <div role="tablist" aria-label={`Tout savoir sur ${part.name}`} className="mt-5 -mx-4 px-4 lg:mx-0 lg:px-0 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {tabs.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} aria-controls={`ps-${t.k}`} onClick={() => setTab(t.k)}
              className="shrink-0 min-h-[44px] px-4 text-sm font-extrabold uppercase tracking-wider transition-colors"
              style={{ clipPath: CHAMFER, background: tab === t.k ? CARBON : "#fff", color: tab === t.k ? "#fff" : CARBON, boxShadow: tab === t.k ? "none" : `inset 0 0 0 1px ${LINE}` }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 min-h-[220px] max-w-5xl">
          {/* ── Compatibilité : toute la liste dans le DOM, repliée par marque ── */}
          <div id="ps-compat" role="tabpanel" className={panel("compat")}>
            <h3 className={h3} style={{ color: GREEN }}>Trottinettes compatibles avec {part.name}</h3>
            {scooters.length > 0 && (
              <label className="relative block max-w-md mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ta trottinette ? ex. Xiaomi 4 Pro" aria-label="Chercher ta trottinette"
                  className="w-full min-h-[48px] pl-9 pr-3 rounded-lg border bg-white text-base focus:outline-none focus:ring-2 focus:ring-green-600" style={{ borderColor: "#D1D5DB" }} />
              </label>
            )}
            {nq.length >= 2 && (
              <div className="mb-4 max-w-md space-y-1.5">
                {hits.length > 0 ? hits.map((s) => (
                  <Link key={s.id} to={`/scooter/${s.slug}`} className="flex items-center gap-2 min-h-[48px] px-3 bg-white text-base font-semibold"
                    style={{ color: s.status === "verified" ? GREEN : "#B45309", clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                    {s.status === "verified" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <HelpCircle className="w-4 h-4 shrink-0" />}
                    {fullName(s)} — {s.status === "verified" ? "compatible" : "à vérifier"}
                  </Link>
                )) : (
                  <p className={p}>Pas dans notre liste. <Link to={askUrl(part, q.trim())} className="font-bold underline inline-flex items-center min-h-[44px]" style={{ color: CARBON }}>On vérifie pour toi</Link>.</p>
                )}
              </div>
            )}
            {groups.length > 0 && <div className="grid sm:grid-cols-2 gap-2">{groups.map((g) => <BrandFold key={g.brand} g={g} />)}</div>}
            {checkGroups.length > 0 && (
              <>
                <h3 className={`${h3} mt-6`} style={{ color: "#B45309" }}>À vérifier ({toCheck.length})</h3>
                <p className={`${p} mb-3`}>Ces modèles partagent une cote proche : demande-nous avant de commander.</p>
                <div className="grid sm:grid-cols-2 gap-2">{checkGroups.map((g) => <BrandFold key={g.brand} g={g} check />)}</div>
              </>
            )}
            <p className={`${p} mt-4`}>
              Ta trottinette n'y est pas ? <Link to={askUrl(part)} className="font-bold underline inline-flex items-center min-h-[44px]" style={{ color: CARBON }}>On vérifie pour toi</Link>.
            </p>
          </div>

          {/* ── Caractéristiques : clés de montage lues en base + fiche fournisseur ── */}
          <div id="ps-tech" role="tabpanel" className={panel("tech")}>
            <h3 className={h3} style={{ color: GREEN }}>Caractéristiques techniques</h3>
            <dl className="grid sm:grid-cols-2 gap-x-10">
              {[...rows, ...extra.map((t) => [t.label, t.value] as [string, string])].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 py-3 border-b" style={{ borderColor: LINE }}>
                  <dt className="text-sm uppercase tracking-wider text-gray-500 shrink-0">{k}</dt>
                  <dd className="text-base text-right" style={{ fontWeight: 700, color: CARBON }}>{v}</dd>
                </div>
              ))}
            </dl>
            {free.length > 0 && <ul className="mt-4 space-y-1.5">{free.map((x) => <li key={x} className={p}>{x}</li>)}</ul>}
            {descText.length > 60 && (
              <div className="mt-6">
                <h3 className={h3} style={{ color: GREEN }}>Description</h3>
                <div className={`quill-content ${p}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(desc) }} />
              </div>
            )}
          </div>

          {guide && (
            <>
              {/* ── Bien choisir ── */}
              <div id="ps-choisir" role="tabpanel" className={panel("choisir")}>
                <h3 className={h3} style={{ color: GREEN }}>Comment choisir {guide.label.startsWith("plaquettes") ? "ses" : guide.label.startsWith("chambre") ? "sa" : "son"} {guide.label}</h3>
                <p className={`${p} max-w-3xl`}>{guide.choose.intro}</p>
                <ol className="mt-4 space-y-3">
                  {guide.choose.steps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-8 h-8 flex items-center justify-center text-sm text-white" style={{ background: GREEN, clipPath: CHAMFER, fontFamily: UNB, fontWeight: 900 }}>{i + 1}</span>
                      <span className={p}>{s}</span>
                    </li>
                  ))}
                </ol>
                {guide.pressure && <p className={`${p} mt-5 bg-white p-4`} style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>{guide.pressure}</p>}
                {guide.choose.pitfalls.length > 0 && (
                  <div className="mt-5">
                    <h3 className={h3} style={{ color: CARBON }}>Les erreurs à éviter</h3>
                    <ul className="space-y-2">{guide.choose.pitfalls.map((x) => (
                      <li key={x} className={`flex gap-3 ${p}`}><span aria-hidden className="mt-2.5 w-2 h-2 shrink-0" style={{ background: "#DC2626" }} /><span>{x}</span></li>
                    ))}</ul>
                  </div>
                )}
              </div>

              {/* ── Montage ── */}
              <div id="ps-montage" role="tabpanel" className={panel("montage")}>
                <h3 className={h3} style={{ color: GREEN }}>Comment installer {part.name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
                  {[
                    { icon: Wrench, label: "Difficulté", value: part.difficulty_level ? `${part.difficulty_level}/5` : guide.install.level },
                    { icon: Clock, label: "Temps", value: part.estimated_install_time_minutes ? `${part.estimated_install_time_minutes} min` : guide.install.time },
                    ...((part.required_tools?.length || guide.install.tools.length) ? [{ icon: Package, label: "Outils", value: (part.required_tools?.length ? part.required_tools : guide.install.tools).join(", ") }] : []),
                  ].map((m) => (
                    <div key={m.label} className={`bg-white px-3 py-2.5 ${m.label === "Outils" ? "col-span-2 sm:col-span-1" : ""}`} style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                      <div className="flex items-center gap-1.5 text-sm uppercase tracking-wider text-gray-500"><m.icon className="w-4 h-4" />{m.label}</div>
                      <div className="text-base" style={{ fontWeight: 800, color: CARBON }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <ol className="space-y-3">
                  {guide.install.steps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="shrink-0 w-8 h-8 flex items-center justify-center text-sm text-white" style={{ background: CARBON, clipPath: CHAMFER, fontFamily: UNB, fontWeight: 900 }}>{i + 1}</span>
                      <span className={p}>{s}</span>
                    </li>
                  ))}
                </ol>
                {part.youtube_video_id && <Video id={part.youtube_video_id} name={part.name} />}
                <p className={`${p} mt-5`}>Pas envie de le faire toi-même ? <Link to="/contact" className="font-bold underline inline-flex items-center min-h-[44px]" style={{ color: CARBON }}>Demande-nous</Link>.</p>
              </div>
            </>
          )}

          {/* ── FAQ ── */}
          {faq.length > 0 && (
            <div id="ps-faq" role="tabpanel" className={`${panel("faq")} space-y-2`}>
              {faq.map((it, i) => (
                <div key={it.q} className="bg-white" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                  <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="w-full flex items-center gap-3 min-h-[56px] px-4 text-left">
                    <h3 className="flex-1 text-base font-bold" style={{ color: CARBON }}>{it.q}</h3>
                    <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  <p className={`px-4 pb-4 ${p} ${openFaq === i ? "" : "hidden"}`}>{it.a}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {siblings.length > 0 && (
          <div className="mt-8">
            <h3 className={h3} style={{ color: CARBON }}>{siblingTitle(part)}</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {siblings.map((x) => (
                <Link key={x.id} to={`/piece/${x.slug}`} className="flex items-center gap-3 min-h-[52px] px-4 py-2 bg-white"
                  style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                  <span className="flex-1 min-w-0 text-base font-semibold" style={{ color: CARBON }}>{x.name}</span>
                  {x.price != null && <span className="shrink-0 text-base" style={{ fontFamily: UNB, fontWeight: 800, fontStyle: "italic", color: CARBON }}>{formatPrice(x.price)}</span>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {guide && guide.sources.length > 0 && (
          <details className="mt-6 text-sm text-gray-500">
            <summary className="cursor-pointer select-none inline-flex items-center min-h-[44px] hover:underline">Sources ({guide.sources.length})</summary>
            <ul className="mt-1 space-y-1">
              {guide.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">{s.label}</a></li>)}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
};

export default PartSeoFiche;
