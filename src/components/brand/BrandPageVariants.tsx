/**
 * Page /marque/:slug — 5 propositions de haut de page (17/10/2026, skill « cinq propositions rendues »).
 * Activées par ?vue=1..5 ; sans paramètre, la page actuelle ne change pas.
 *
 * Défaut corrigé dans les 5 : en-tête à part (« Retour / Catalogue ») au lieu du menu du site,
 * grand bandeau vide quand la marque n'a pas de photo (41 marques sur 50), carte d'avis arrondie
 * avec pastille orange, sections aux styles disparates. Ici : menu du site, identité Pit-stand
 * (Unbounded italique, plaques à coin coupé, filet vert), photos de la gamme quand la marque n'a pas de visuel.
 * Corps commun : avis de l'atelier, histoire, gamme, TOUTES les pièces (BrandPartsExplorer), FAQ.
 *
 * 1 PIT-STAND   · logo + nom + fiche (pays, année, modèles) à gauche, visuel ou trio de modèles à droite
 * 2 CARBONE     · bandeau noir, nom géant, bande de photos de la gamme
 * 3 AFFICHE     · nom de marque en filigrane géant derrière le modèle phare
 * 4 VITRINE     · mosaïque de 4 modèles, titre et fiche par-dessus
 * 5 SOMMAIRE    · en-tête compact + raccourcis (Avis · Gamme · Pièces · FAQ) : le contenu d'abord
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Globe, Calendar, Bike, Quote } from "lucide-react";
import Header from "@/components/Header";
import type { BrandData, BrandModel } from "@/hooks/useBrandData";
import BrandPartsExplorer from "@/components/brand/BrandPartsExplorer";
import BrandVideo from "@/components/brand/BrandVideo";
import { optimizedImage } from "@/lib/imageTransform";
import BrandStage, { STAGE_NAMES, type StageScene } from "@/components/brand/BrandStage";
import { brandIdentity } from "@/config/brandIdentity";

export type BrandLook = 1 | 2 | 3 | 4 | 5;
export const BRAND_LOOK_NAMES: Record<BrandLook, string> = { 1: "Pit-stand", 2: "Carbone", 3: "Affiche", 4: "Vitrine", 5: "Sommaire" };

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";

interface Props {
  look: BrandLook;
  brand: BrandData;
  models: BrandModel[];
  prev: { slug: string; name: string } | null;
  next: { slug: string; name: string } | null;
  showTag?: boolean;
  scene?: StageScene;
}

// ─── Petits éléments ───
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const Logo = ({ brand, dark = false, size = 56 }: { brand: BrandData; dark?: boolean; size?: number }) =>
  brand.logo_url ? (
    <span className="inline-flex items-center justify-center p-2" style={{ width: size, height: size, background: "#fff", clipPath: CHAMFER, boxShadow: dark ? "none" : `inset 0 0 0 1px ${LINE}` }}>
      <img src={brand.logo_url} alt={`Logo ${brand.name}`} className="max-w-full max-h-full object-contain" />
    </span>
  ) : null;

const Name = ({ brand, dark = false, size = "text-4xl md:text-6xl" }: { brand: BrandData; dark?: boolean; size?: string }) => (
  <h1 className={`${size} uppercase leading-[0.95]`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.04em", color: dark ? "#fff" : CARBON }}>
    {brand.name}
  </h1>
);

const Facts = ({ brand, models, dark = false }: { brand: BrandData; models: BrandModel[]; dark?: boolean }) => {
  const items = [
    brand.country ? { icon: Globe, k: "Origine", v: brand.country } : null,
    brand.founded_year ? { icon: Calendar, k: "Depuis", v: String(brand.founded_year) } : null,
    { icon: Bike, k: "Modèles", v: String(models.length) },
  ].filter(Boolean) as { icon: typeof Globe; k: string; v: string }[];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((it) => (
        <div key={it.k} className="relative px-3 py-2.5 overflow-hidden" style={{ background: dark ? "rgba(255,255,255,0.07)" : "#fff", boxShadow: dark ? "none" : `inset 0 0 0 1px ${LINE}`, clipPath: CHAMFER }}>
          <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1" style={{ background: GREEN }} />
          <div className={`text-sm uppercase tracking-wider ${dark ? "text-white/60" : "text-gray-500"}`} style={{ fontFamily: FONT }}>{it.k}</div>
          <div className="text-sm md:text-lg leading-tight break-words" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: dark ? "#fff" : CARBON }}>{it.v}</div>
        </div>
      ))}
    </div>
  );
};

const Actions = ({ brand, dark = false }: { brand: BrandData; dark?: boolean }) => (
  <div className="flex flex-wrap gap-2.5">
    <button type="button" onClick={() => scrollTo("pieces")} className="inline-flex items-center gap-2 min-h-[52px] px-6 -skew-x-12 text-sm uppercase tracking-[0.12em] text-white"
      style={{ background: GREEN, borderRadius: 4, boxShadow: `4px 4px 0 ${dark ? "#fff" : CARBON}`, fontFamily: UNB, fontWeight: 700, fontStyle: "italic" }}>
      <span className="inline-flex items-center gap-2" style={{ transform: "skewX(12deg)" }}>Pièces {brand.name} <ArrowRight className="w-4 h-4" /></span>
    </button>
    <button type="button" onClick={() => scrollTo("gamme")} className="inline-flex items-center gap-2 min-h-[52px] px-6 -skew-x-12 text-sm uppercase tracking-[0.12em]"
      style={{ background: dark ? "#fff" : CARBON, color: dark ? CARBON : "#fff", borderRadius: 4, fontFamily: UNB, fontWeight: 700, fontStyle: "italic" }}>
      <span style={{ transform: "skewX(12deg)" }}>La gamme</span>
    </button>
  </div>
);

const PrevNext = ({ prev, next, dark = false }: { prev: Props["prev"]; next: Props["next"]; dark?: boolean }) => (
  <div className={`flex justify-between gap-2 text-sm font-bold ${dark ? "text-white/70" : "text-gray-500"}`} style={{ fontFamily: FONT }}>
    {prev ? <Link to={`/marque/${prev.slug}`} className="inline-flex items-center min-h-[44px] hover:underline">← {prev.name}</Link> : <span />}
    <Link to="/marques" className="inline-flex items-center min-h-[44px] hover:underline">Toutes les marques</Link>
    {next ? <Link to={`/marque/${next.slug}`} className="inline-flex items-center min-h-[44px] hover:underline">{next.name} →</Link> : <span />}
  </div>
);

const modelImg = (m: BrandModel, w = 600) => (m.image_url ? optimizedImage(m.image_url, w) : null);
const topModels = (models: BrandModel[], n: number) => models.filter((m) => m.image_url).slice(0, n);

// ─── Corps commun ───
const Rule = ({ id, title, children, bg = "#FAFAF8" }: { id?: string; title: string; children: React.ReactNode; bg?: string }) => (
  <section id={id} className="px-4 py-10 lg:px-8 scroll-mt-20" style={{ backgroundColor: bg }}>
    <div className="mx-auto max-w-7xl grid lg:grid-cols-[280px_1fr] gap-3 lg:gap-10 border-t-2 pt-6" style={{ borderColor: CARBON }}>
      <h2 className="text-2xl lg:text-3xl uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: CARBON }}>{title}</h2>
      <div className="min-w-0">{children}</div>
    </div>
  </section>
);

const Verdict = ({ text }: { text: string }) => (
  <div className="relative bg-white p-5 md:p-7 max-w-3xl" style={{ clipPath: CHAMFER, boxShadow: `inset 5px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
    <Quote className="w-7 h-7 mb-3" style={{ color: GREEN }} />
    <p className="text-lg md:text-xl leading-relaxed" style={{ fontFamily: FONT, color: CARBON, fontWeight: 500 }}>{text}</p>
    <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-gray-500" style={{ fontFamily: FONT }}>Nolan · atelier de Marseille</p>
  </div>
);

// Gamme (retour Nolan 17/10 : « ça va pas du tout, c'est pas très joli ») : les plus puissantes d'abord,
// grande photo sur fond d'atelier avec ombre au sol, nom en italique racing, cotes en chiffres,
// filet à la couleur de la marque.
const Gamme = ({ models, accent }: { models: BrandModel[]; accent: string }) => {
  const [all, setAll] = useState(false);
  const sorted = [...models].sort((a, b) => (b.power_watts ?? 0) - (a.power_watts ?? 0));
  const list = all ? sorted : sorted.slice(0, 8);
  if (models.length === 0) return <p className="text-base text-gray-600" style={{ fontFamily: FONT }}>La gamme arrive bientôt.</p>;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {list.map((m) => (
          <Link key={m.id} to={`/scooter/${m.slug}`} className="group relative flex flex-col bg-white transition-transform hover:-translate-y-1" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
            <div className="relative aspect-square sm:aspect-[5/4] overflow-hidden" style={{ background: "linear-gradient(180deg, #EFEAE0 0%, #FAF8F3 70%, #FFFFFF 100%)" }}>
              <span aria-hidden className="absolute left-1/2 bottom-[9%] -translate-x-1/2 w-[70%] h-[7%] rounded-[50%]" style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.22), transparent)" }} />
              {modelImg(m, 500) ? (
                <img src={modelImg(m, 500)!} alt={m.name} loading="lazy" className="absolute inset-x-[6%] top-[5%] bottom-[10%] m-auto h-[85%] w-[88%] object-contain transition-transform duration-300 group-hover:scale-[1.06]" />
              ) : <Bike className="absolute inset-0 m-auto w-10 h-10 text-gray-300" />}
            </div>
            <div className="flex-1 flex flex-col px-3 pt-3 pb-3.5">
              <div className="text-sm uppercase leading-tight line-clamp-2" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>{m.name}</div>
              <div className="mt-auto pt-2.5 flex items-baseline gap-3 flex-wrap" style={{ fontFamily: FONT }}>
                {m.power_watts ? <span className="text-sm text-gray-500"><b className="text-base" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color: CARBON }}>{m.power_watts.toLocaleString("fr-FR")}</b> W</span> : null}
                {m.range_km ? <span className="text-sm text-gray-500"><b className="text-base" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color: CARBON }}>{m.range_km}</b> km</span> : null}
              </div>
            </div>
            <span aria-hidden className="absolute left-0 right-0 bottom-0 h-1 transition-all group-hover:h-1.5" style={{ background: accent }} />
          </Link>
        ))}
      </div>
      {models.length > 8 && (
        <button type="button" onClick={() => setAll(!all)} className="mt-5 inline-flex items-center min-h-[48px] px-6 text-sm font-extrabold uppercase tracking-wider bg-white"
          style={{ fontFamily: FONT, color: CARBON, clipPath: CHAMFER, boxShadow: `inset 0 0 0 1.5px ${CARBON}` }}>
          {all ? "Réduire" : `Voir les ${models.length} modèles`}
        </button>
      )}
    </>
  );
};

const Faq = ({ items }: { items: { q: string; a: string }[] }) => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2 max-w-3xl">
      {items.map((it, i) => (
        <div key={i} className="bg-white" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
          <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full flex items-center gap-3 min-h-[56px] px-4 text-left">
            <span className="flex-1 text-base font-bold" style={{ fontFamily: FONT, color: CARBON }}>{it.q}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && <p className="px-4 pb-4 text-base text-[#374151] leading-relaxed" style={{ fontFamily: FONT }}>{it.a}</p>}
        </div>
      ))}
    </div>
  );
};

const Body = ({ brand, models }: { brand: BrandData; models: BrandModel[] }) => (
  <>
    {brand.editorial_verdict && <Rule id="avis" title="L'avis de l'atelier"><Verdict text={brand.editorial_verdict} /></Rule>}
    <Rule id="gamme" title={`La gamme ${brand.name}`}><Gamme models={models} accent={brandIdentity(brand.slug, brand.accent_color).accent} /></Rule>
    <BrandPartsExplorer brandName={brand.name} models={models} />
    {brand.description && <Rule id="histoire" title="L'histoire"><p className="max-w-3xl text-base md:text-lg text-[#374151] leading-relaxed" style={{ fontFamily: FONT }}>{brand.description}</p></Rule>}
    {brand.youtube_video_id && <BrandVideo videoId={brand.youtube_video_id} brandName={brand.name} accentColor={GREEN} />}
    {Array.isArray(brand.faq) && brand.faq.length > 0 && <Rule id="faq" title="Questions fréquentes"><Faq items={brand.faq} /></Rule>}
    {brand.website_url && (
      <section className="px-4 pb-14 lg:px-8" style={{ backgroundColor: "#FAFAF8" }}>
        <div className="mx-auto max-w-7xl">
          <a href={brand.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 min-h-[48px] text-sm font-bold underline" style={{ fontFamily: FONT, color: CARBON }}>
            Site officiel {brand.name} <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    )}
  </>
);

// ─── 1 · PIT-STAND (retour Nolan 17/10 : garder le carrousel de marques de l'ancienne page) ───
// Marques voisines en filigrane à gauche / à droite (cliquables, glisser au doigt sur téléphone),
// chevrons en plaques, puis un bandeau défilant avec les logos de TOUTES les marques.
type RailBrand = { slug: string; name: string; logo_url: string | null };
const useAllBrands = () =>
  useQuery({
    queryKey: ["brands-rail"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<RailBrand[]> => {
      const { data, error } = await supabase.from("brands").select("slug, name, logo_url").eq("published", true).order("display_order", { ascending: true }).order("name", { ascending: true });
      if (error) throw error;
      return (data as unknown as RailBrand[]) ?? [];
    },
  });

const Ghost = ({ item, side }: { item: { slug: string; name: string } | null; side: "left" | "right" }) =>
  item ? (
    <Link to={`/marque/${item.slug}`} aria-label={`Marque ${side === "left" ? "précédente" : "suivante"} : ${item.name}`}
      className={`group hidden lg:block absolute top-1/2 -translate-y-1/2 z-0 select-none whitespace-nowrap leading-none transition-transform duration-500 ${side === "left" ? "left-0 -translate-x-[45%] hover:-translate-x-[38%]" : "right-0 translate-x-[45%] hover:translate-x-[38%] text-right"}`}
      style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", fontSize: "clamp(120px, 13vw, 220px)", letterSpacing: "-0.05em", color: "transparent", WebkitTextStroke: "2px rgba(26,26,26,0.13)" }}>
      <span className="transition-[-webkit-text-stroke] group-hover:[-webkit-text-stroke:2px_rgba(74,124,89,0.55)]">{item.name.toUpperCase()}</span>
    </Link>
  ) : null;

const Chevron = ({ item, side }: { item: { slug: string; name: string } | null; side: "left" | "right" }) =>
  item ? (
    <Link to={`/marque/${item.slug}`} aria-label={`${side === "left" ? "Précédente" : "Suivante"} : ${item.name}`}
      className="inline-flex items-center gap-2 min-h-[44px] pl-2 pr-3 bg-white text-sm font-extrabold uppercase tracking-wide"
      style={{ fontFamily: FONT, color: CARBON, clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
      {side === "left" && <ChevronLeft className="w-4 h-4" />}{item.name}{side === "right" && <ChevronRight className="w-4 h-4" />}
    </Link>
  ) : <span />;

const BrandRail = ({ current }: { current: string }) => {
  const { data: all = [] } = useAllBrands();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-slug="${current}"]`);
    if (el && ref.current) ref.current.scrollTo({ left: el.offsetLeft - ref.current.clientWidth / 2 + el.clientWidth / 2, behavior: "instant" as ScrollBehavior });
  }, [all.length, current]);
  const slide = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const onDown = (e: React.PointerEvent) => { if (e.pointerType === "mouse" && ref.current) drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false }; };
  const onMove = (e: React.PointerEvent) => { const d = drag.current; if (!d || !ref.current) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 5) d.moved = true; ref.current.scrollLeft = d.left - dx; };
  const onUp = () => { setTimeout(() => { drag.current = null; }, 0); };
  const onClickCapture = (e: React.MouseEvent) => { if (drag.current?.moved) { e.preventDefault(); e.stopPropagation(); } };
  if (all.length < 2) return null;
  return (
    <div className="border-y-2" style={{ borderColor: CARBON, background: "#F3EFE7" }}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8 pt-3 flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500" style={{ fontFamily: FONT }}>Les {all.length} marques</span>
        <Link to="/marques" className="text-sm font-bold underline min-h-[44px] inline-flex items-center" style={{ fontFamily: FONT, color: CARBON }}>Toutes les voir</Link>
      </div>
      <div className="relative">
      {/* Ordinateur (retour Nolan 17/10 : « on peut pas naviguer sur l'ordinateur ») : flèches, glisser à la souris. */}
      {(["left", "right"] as const).map((side) => (
        <button key={side} type="button" onClick={() => slide(side === "left" ? -1 : 1)} aria-label={side === "left" ? "Marques précédentes" : "Marques suivantes"}
          className={`hidden md:flex absolute top-1 bottom-4 z-10 w-12 items-center justify-center ${side === "left" ? "left-0" : "right-0"}`}
          style={{ background: `linear-gradient(${side === "left" ? "90deg" : "270deg"}, #F3EFE7 55%, rgba(243,239,231,0))` }}>
          <span className="w-11 h-11 flex items-center justify-center text-white" style={{ background: CARBON, clipPath: CHAMFER }}>
            {side === "left" ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </span>
        </button>
      ))}
      <div ref={ref} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onClickCapture={onClickCapture}
        className="flex gap-2 overflow-x-auto px-4 md:px-14 pb-4 pt-1 snap-x md:snap-none md:cursor-grab select-none" style={{ scrollbarWidth: "none" }}>
        {all.map((b) => {
          const on = b.slug === current;
          return (
            <Link key={b.slug} data-slug={b.slug} to={`/marque/${b.slug}`} draggable={false} aria-current={on ? "page" : undefined}
              className="snap-center shrink-0 w-[104px] h-[92px] flex flex-col items-center justify-center gap-1.5 px-2 transition-transform hover:-translate-y-0.5"
              style={{ clipPath: CHAMFER, background: on ? CARBON : "#fff", boxShadow: on ? "none" : `inset 0 0 0 1px ${LINE}` }}>
              <span className="w-12 h-10 flex items-center justify-center" style={on ? { background: "#fff", padding: 4 } : undefined}>
                {b.logo_url ? <img src={b.logo_url} alt="" loading="lazy" draggable={false} className="max-w-full max-h-full object-contain" /> : <span className="text-lg" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: on ? "#fff" : CARBON }}>{b.name.slice(0, 2)}</span>}
              </span>
              <span className="text-sm font-extrabold truncate max-w-full" style={{ fontFamily: FONT, color: on ? "#fff" : CARBON }}>{b.name}</span>
            </Link>
          );
        })}
      </div>
      </div>
    </div>
  );
};

const PitStand = (p: Props) => {
  const navigate = useNavigate();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = e.changedTouches[0]; const dx = t.clientX - touch.current.x; const dy = t.clientY - touch.current.y; touch.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0 && p.next) navigate(`/marque/${p.next.slug}`); else if (dx > 0 && p.prev) navigate(`/marque/${p.prev.slug}`); }
  };
  return (
    <>
      <section className="relative overflow-hidden px-4 pt-24 lg:pt-28 pb-10 lg:px-8" style={{ backgroundColor: "#FAFAF8" }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Ghost item={p.prev} side="left" />
        <Ghost item={p.next} side="right" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-2"><Chevron item={p.prev} side="left" /><Chevron item={p.next} side="right" /></div>
          <div className="mt-4 grid lg:grid-cols-[1fr_1.2fr] gap-8 items-center">
            <div>
              <div className="flex items-center gap-4"><Logo brand={p.brand} size={64} /><span className="text-sm font-bold uppercase tracking-[0.18em]" style={{ fontFamily: FONT, color: GREEN }}>Marque</span></div>
              <div className="mt-3"><Name brand={p.brand} size="text-5xl md:text-7xl" /></div>
              {p.brand.tagline && <p className="mt-3 text-lg text-[#374151]" style={{ fontFamily: FONT }}>{p.brand.tagline}</p>}
              {/* Téléphone : le visuel juste sous le nom, pas sous la ligne de flottaison. */}
              <div className="mt-5 lg:hidden"><BrandStage brand={p.brand} models={p.models} scene={p.scene ?? 4} /></div>
              <div className="mt-5"><Facts brand={p.brand} models={p.models} /></div>
              <div className="mt-6"><Actions brand={p.brand} /></div>
            </div>
            <div className="hidden lg:block"><BrandStage brand={p.brand} models={p.models} scene={p.scene ?? 4} /></div>
          </div>
          <p className="mt-6 lg:hidden text-center text-sm text-gray-500" style={{ fontFamily: FONT }}>Glisse pour passer à la marque suivante</p>
        </div>
      </section>
      <BrandRail current={p.brand.slug} />
    </>
  );
};

// ─── 2 · CARBONE ───
const Carbone = (p: Props) => {
  const strip = topModels(p.models, 6);
  return (
    <section className="pt-20 lg:pt-24" style={{ backgroundColor: CARBON }}>
      <div className="px-4 lg:px-8 mx-auto max-w-7xl pt-4">
        <PrevNext prev={p.prev} next={p.next} dark />
        <div className="mt-3 flex items-center gap-4"><Logo brand={p.brand} dark /><span className="text-sm font-bold uppercase tracking-[0.18em] text-white/60" style={{ fontFamily: FONT }}>{p.brand.tagline}</span></div>
        <div className="mt-3"><Name brand={p.brand} dark size="text-5xl md:text-8xl" /></div>
        <div className="mt-5 max-w-xl"><Facts brand={p.brand} models={p.models} dark /></div>
        <div className="mt-6"><Actions brand={p.brand} dark /></div>
      </div>
      <div className="mt-8 border-t border-white/10 bg-[#222] px-4 lg:px-8 py-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-4 mx-auto max-w-7xl">
          {strip.map((m) => (
            <Link key={m.id} to={`/scooter/${m.slug}`} className="shrink-0 w-36 md:w-44 text-center">
              <div className="h-28 md:h-32 flex items-end justify-center"><img src={modelImg(m, 400)!} alt={m.name} className="max-h-full max-w-full object-contain" /></div>
              <div className="mt-2 text-sm font-bold text-white/80 truncate" style={{ fontFamily: FONT }}>{m.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── 3 · AFFICHE ───
const Affiche = (p: Props) => {
  const hero = topModels(p.models, 1)[0];
  return (
    <section className="relative px-4 pt-24 lg:pt-28 pb-10 lg:px-8 overflow-hidden" style={{ backgroundColor: "#FAFAF8" }}>
      <div aria-hidden className="absolute inset-x-0 top-24 text-center select-none leading-none whitespace-nowrap"
        style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", fontSize: "clamp(80px, 20vw, 280px)", letterSpacing: "-0.05em", color: "transparent", WebkitTextStroke: "2px rgba(26,26,26,0.10)" }}>
        {p.brand.name.toUpperCase()}
      </div>
      <div className="relative mx-auto max-w-7xl">
        <PrevNext prev={p.prev} next={p.next} />
        <div className="mt-4 flex justify-center" style={{ height: "clamp(220px, 34vw, 440px)" }}>
          {p.brand.hero_image_url ? <img src={optimizedImage(p.brand.hero_image_url, 1200)} alt={p.brand.name} className="h-full object-contain" />
            : hero ? <img src={modelImg(hero, 900)!} alt={hero.name} className="h-full object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.2)]" /> : null}
        </div>
        <div className="mt-4 grid lg:grid-cols-[1fr_auto] gap-5 items-end">
          <div>
            <div className="flex items-center gap-4"><Logo brand={p.brand} size={48} /><Name brand={p.brand} size="text-3xl md:text-5xl" /></div>
            {p.brand.tagline && <p className="mt-2 text-lg text-[#374151]" style={{ fontFamily: FONT }}>{p.brand.tagline}</p>}
          </div>
          <Actions brand={p.brand} />
        </div>
        <div className="mt-5 max-w-xl"><Facts brand={p.brand} models={p.models} /></div>
      </div>
    </section>
  );
};

// ─── 4 · VITRINE ───
const Vitrine = (p: Props) => {
  const four = topModels(p.models, 4);
  return (
    <section className="px-4 pt-24 lg:pt-28 pb-10 lg:px-8" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="mx-auto max-w-7xl">
        <PrevNext prev={p.prev} next={p.next} />
        <div className="mt-2 grid lg:grid-cols-[1fr_1.1fr] gap-6 items-stretch">
          <div className="flex flex-col justify-center">
            <Logo brand={p.brand} size={64} />
            <div className="mt-4"><Name brand={p.brand} /></div>
            {p.brand.tagline && <p className="mt-3 text-lg text-[#374151]" style={{ fontFamily: FONT }}>{p.brand.tagline}</p>}
            <div className="mt-5"><Facts brand={p.brand} models={p.models} /></div>
            <div className="mt-6"><Actions brand={p.brand} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {four.map((m) => (
              <Link key={m.id} to={`/scooter/${m.slug}`} className="relative bg-white p-3 flex flex-col" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                <div className="flex-1 min-h-[110px] md:min-h-[150px] flex items-center justify-center"><img src={modelImg(m, 500)!} alt={m.name} className="max-h-[150px] max-w-full object-contain" /></div>
                <div className="mt-1 text-sm font-extrabold truncate" style={{ fontFamily: FONT, color: CARBON }}>{m.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── 5 · SOMMAIRE ───
const Sommaire = (p: Props) => (
  <section className="px-4 pt-24 lg:pt-28 pb-6 lg:px-8" style={{ backgroundColor: "#FAFAF8" }}>
    <div className="mx-auto max-w-7xl">
      <PrevNext prev={p.prev} next={p.next} />
      <div className="mt-2 flex items-center gap-4 flex-wrap">
        <Logo brand={p.brand} size={64} />
        <div className="min-w-0"><Name brand={p.brand} size="text-3xl md:text-5xl" />{p.brand.tagline && <p className="mt-1 text-base text-[#374151]" style={{ fontFamily: FONT }}>{p.brand.tagline}</p>}</div>
      </div>
      <div className="mt-5 max-w-xl"><Facts brand={p.brand} models={p.models} /></div>
      <nav className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2" aria-label="Sommaire">
        {[["avis", "01", "L'avis"], ["gamme", "02", `La gamme · ${p.models.length}`], ["pieces", "03", "Les pièces"], ["faq", "04", "Questions"]].map(([id, n, l]) => (
          <button key={id} type="button" onClick={() => scrollTo(id)} className="text-left min-h-[56px] px-4 bg-white" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
            <span className="text-sm" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color: GREEN }}>{n}</span>{" "}
            <span className="text-sm font-extrabold uppercase" style={{ fontFamily: FONT, color: CARBON }}>{l}</span>
          </button>
        ))}
      </nav>
    </div>
  </section>
);

const BrandPageVariants = (p: Props) => {
  const Hero = { 1: PitStand, 2: Carbone, 3: Affiche, 4: Vitrine, 5: Sommaire }[p.look];
  return (
    <>
      <Header />
      {p.showTag && (
        <div className="fixed top-20 right-3 z-40 rounded-full px-3 py-1.5 text-sm font-bold text-white shadow" style={{ backgroundColor: CARBON, fontFamily: FONT }}>
          {p.scene && p.scene > 0 ? `Scène ${p.scene} · ${STAGE_NAMES[p.scene]}` : `Proposition ${p.look} · ${BRAND_LOOK_NAMES[p.look]}`}
        </div>
      )}
      <main className="flex-1">
        <Hero {...p} />
        <Body brand={p.brand} models={p.models} />
      </main>
    </>
  );
};

export default BrandPageVariants;
