/**
 * Haut de page catégorie « Vitrine montante » (choix de Nolan, 24/10/2026).
 * Bandeau crème plein cadre : l'image détourée de la catégorie, inclinée, débordante,
 * JAMAIS affichée plus grande que sa taille réelle (520 px → nette ; l'ancien bandeau
 * l'étirait sur 1 216 px, d'où le flou). Titre + texte indexable + 3 chiffres lus en base,
 * puis les 3 pièces « les plus montées » qui remontent dans le bandeau.
 * Ancien bandeau joignable par ?vitrine=0 (Categorie.tsx).
 */
import { useMemo, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { classifyCompat } from "@/lib/compatibilityStatus";
import { getPrimaryImage } from "@/lib/entityImage";
import { optimizedImage } from "@/lib/imageTransform";
import { useCart } from "@/hooks/useCart";
import { SHOP_OPEN, openPrelaunch } from "@/config/launch";
import type { CataloguePart } from "@/hooks/useCatalogueData";

const FONT = "'Plus Jakarta Sans', sans-serif";
const DISP = "'Unbounded', sans-serif";
const GREEN = "#4A7C59";
const INK = "#1A1A1A";
const MUTED = "#6B7280";
const ch = (c: number) => `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;

/** Nombre de trottinettes affichées compatibles (mêmes règles que les fiches : classifyCompat ≠ masqué). */
const useCompatCounts = (ids: string[]) =>
  useQuery({
    queryKey: ["category-compat-counts", ids.join(",")],
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Record<string, number>> => {
      const counts: Record<string, number> = {};
      // Par paquets de 150 ids (longueur d'URL), et pagination 1 000 lignes (plafond PostgREST).
      for (let i = 0; i < ids.length; i += 150) {
        const chunk = ids.slice(i, i + 150);
        for (let from = 0; ; from += 1000) {
          const { data, error } = await supabase
            .from("part_compatibility")
            .select("part_id, confidence_level, suggestion_reason")
            .in("part_id", chunk)
            .order("id")
            .range(from, from + 999);
          if (error) throw error;
          for (const r of data ?? []) {
            if (classifyCompat(r)) counts[r.part_id] = (counts[r.part_id] ?? 0) + 1;
          }
          if (!data || data.length < 1000) break;
        }
      }
      return counts;
    },
  });

const eur = (n: number) => n.toFixed(2).replace(".", ",") + " €";

const TopCard = ({ part, rank, compat }: { part: CataloguePart; rank: number; compat: number }) => {
  const { addItem, setIsOpen } = useCart();
  const img = getPrimaryImage(part.images, part.image_url, "");
  const out = part.stock_quantity === 0;
  const add = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!SHOP_OPEN) { openPrelaunch(); return; }
    if (out || part.price === null) return;
    addItem({ id: part.id, name: part.name, price: part.price, image_url: img || part.image_url, stock_quantity: part.stock_quantity || 0 });
    toast.success(`${part.name} ajouté au panier`, { action: { label: "Voir", onClick: () => setIsOpen(true) } });
  };
  return (
    <Link
      to={`/piece/${part.slug}`}
      className="grid grid-cols-[84px_minmax(0,1fr)] md:grid-cols-[104px_minmax(0,1fr)] gap-3.5 items-center bg-white p-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] transition-shadow hover:shadow-[0_22px_44px_-20px_rgba(0,0,0,0.4)]"
      style={{ clipPath: ch(14) }}
    >
      <span className="flex items-center justify-center w-[84px] h-[84px] md:w-[104px] md:h-[104px]">
        {img && <img src={optimizedImage(img, 220)} alt="" loading="eager" className="max-w-full max-h-full object-contain" />}
      </span>
      <span className="min-w-0 grid gap-0.5">
        <span className="text-sm font-black" style={{ fontFamily: DISP, fontStyle: "italic", color: GREEN }}>N°{rank}</span>
        <span className="text-[15px] font-bold leading-snug line-clamp-2" style={{ fontFamily: FONT, color: INK }}>{part.name}</span>
        {compat > 0 && <span className="text-sm font-semibold" style={{ fontFamily: FONT, color: MUTED }}>Va sur {compat} trottinette{compat > 1 ? "s" : ""}</span>}
        <span className="flex items-center gap-2.5 mt-1.5 flex-wrap">
          {part.price !== null && (
            <span className="text-lg font-extrabold" style={{ fontFamily: DISP, fontStyle: "italic", color: INK }}>{eur(part.price)}</span>
          )}
          <button
            type="button"
            onClick={add}
            disabled={out || part.price === null}
            className="min-h-[44px] px-4 text-sm font-extrabold text-white disabled:opacity-50"
            style={{ background: "#FF6600", fontFamily: FONT, clipPath: ch(8) }}
          >
            {out ? "En rupture" : "Ajouter"}
          </button>
        </span>
      </span>
    </Link>
  );
};

interface Props {
  name: string;
  heading: string;
  imageUrl: string | null;
  imageAlt: string;
  bodyText: string;
  parts: CataloguePart[];
}

const CategoryVitrine = ({ heading, imageUrl, imageAlt, bodyText, parts }: Props) => {
  const ids = useMemo(() => parts.map((p) => p.id), [parts]);
  const { data: counts } = useCompatCounts(ids);

  const minPrice = useMemo(() => {
    const prices = parts.map((p) => p.price).filter((v): v is number => v !== null && v > 0);
    return prices.length ? Math.min(...prices) : null;
  }, [parts]);

  // Les plus montées = celles qui vont sur le plus de trottinettes, en stock et avec un prix.
  const top = useMemo(() => {
    if (!counts) return [];
    return parts
      .filter((p) => p.price !== null && p.stock_quantity !== 0 && (counts[p.id] ?? 0) > 0)
      .map((p, i) => ({ p, n: counts[p.id] ?? 0, i }))
      .sort((a, b) => b.n - a.n || a.i - b.i)
      .slice(0, 3);
  }, [parts, counts]);

  const facts = [
    { v: String(parts.length), l: parts.length > 1 ? "références" : "référence" },
    minPrice !== null ? { v: eur(minPrice).replace(",00", ""), l: "prix d'entrée" } : null,
    top[0] ? { v: String(top[0].n), l: "trottinettes pour la n°1" } : null,
  ].filter(Boolean) as { v: string; l: string }[];

  const rises = top.length > 0;

  return (
    <section className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-3">
      <div
        className={`relative overflow-hidden flex flex-col md:flex-row md:items-center md:min-h-[440px] ${rises ? "pb-[124px] md:pb-[118px]" : "pb-6 md:pb-10"}`}
        style={{ background: "#E9E2D4", clipPath: ch(30) }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={imageAlt}
            loading="eager"
            // Taille plafonnée à 520 px (taille réelle des visuels détourés) : jamais étirée.
            className="pointer-events-none relative self-center w-[230px] max-h-[230px] object-contain mt-5 md:absolute md:mt-0 md:max-h-[86%] md:w-[min(520px,46%)] md:right-[-10px] md:top-1/2 md:-translate-y-1/2"
            style={{ rotate: "-8deg", filter: "drop-shadow(0 24px 30px rgba(0,0,0,0.3))" }}
          />
        )}
        <div className="relative z-10 w-full md:max-w-[60%] px-5 pt-3 md:px-10 md:py-10">
          <h1
            className="uppercase"
            style={{ fontFamily: DISP, fontWeight: 900, fontStyle: "italic", fontSize: "clamp(2.2rem,6.4vw,5rem)", lineHeight: 0.95, letterSpacing: "-0.03em", color: INK, textWrap: "balance" }}
          >
            {heading}
          </h1>
          <p className="mt-3 max-w-[46ch] text-base" style={{ fontFamily: FONT, color: "#3B3B3B", lineHeight: 1.55 }}>
            {bodyText}
          </p>
          {facts.length > 0 && (
            <dl className="mt-5 grid max-w-[520px]" style={{ gridTemplateColumns: `repeat(${facts.length}, minmax(0,1fr))`, borderTop: `2px solid ${INK}` }}>
              {facts.map((f) => (
                <div key={f.l} className="pt-3 pr-3">
                  <dt className="sr-only">{f.l}</dt>
                  <dd className="m-0">
                    <b className="block text-[19px] md:text-2xl font-black tabular-nums" style={{ fontFamily: DISP, fontStyle: "italic", color: INK }}>{f.v}</b>
                    <span className="text-sm" style={{ fontFamily: FONT, color: MUTED }}>{f.l}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {rises && (
        <div className="relative z-10 -mt-[100px] mx-2 md:mx-6">
          <p className="sr-only">Les plus montées</p>
          <div className="grid gap-3 md:gap-4 grid-cols-[minmax(0,1fr)] lg:grid-cols-3">
            {top.map(({ p, n }, i) => <TopCard key={p.id} part={p} rank={i + 1} compat={n} />)}
          </div>
        </div>
      )}
    </section>
  );
};

export default CategoryVitrine;
