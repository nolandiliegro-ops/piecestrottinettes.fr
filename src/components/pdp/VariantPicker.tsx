/**
 * Sélecteur de variante sur la fiche pièce (31/10/2026, Nolan : « il faut que j'aie le sélecteur aussi
 * quand j'ouvre la fiche produit »). Même famille que la grille catégorie (taille + jante, `groupFamilies`) :
 * chaque valve est une tuile dessinée avec son prix ; toucher une autre valve ouvre SA fiche (URL propre,
 * panier au bon `parts.id`). Rien ne s'affiche si la pièce est seule dans sa famille.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAllParts } from "@/hooks/useCatalogueData";
import { groupFamilies } from "@/lib/partFamilies";
import { ValvePicto } from "@/components/category/FamilyGrid";

const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const FAMILY_CATEGORIES = ["chambres-a-air"];

interface Props {
  partId: string;
  categoryId: string | null;
  categorySlug: string | null | undefined;
}

const eur = (n: number | null) => (n == null ? "" : `${n.toFixed(2).replace(".", ",")} €`);

const VariantPicker = ({ partId, categoryId, categorySlug }: Props) => {
  const on = !!categorySlug && FAMILY_CATEGORIES.includes(categorySlug);
  const { data: parts = [] } = useAllParts(on ? categoryId : null);
  const family = useMemo(() => {
    if (!on || !parts.length) return null;
    return groupFamilies(parts).find((f) => f.variants.some((v) => v.part.id === partId)) ?? null;
  }, [on, parts, partId]);
  if (!family || family.variants.length < 2) return null;
  const gammes = new Set(family.variants.map((v) => v.gamme)).size > 1;
  return (
    <div className="mt-5" aria-label="Choisir la valve">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="text-sm font-bold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: CARBON }}>
          Ta valve <span className="text-gray-500 normal-case tracking-normal font-semibold">· {family.variants.length} choix{gammes ? " · standard ou renforcée" : ""}</span>
        </p>
      </div>
      <p className="mt-1 text-sm text-gray-600" style={{ fontFamily: FONT }}>Regarde comment sort ta valve actuelle : droite, ou coudée (et de combien).</p>
      <div className="mt-2.5 grid grid-cols-3 sm:grid-cols-4 gap-2">
        {family.variants.map((v) => {
          const cur = v.part.id === partId;
          const out = v.part.stock_quantity !== null && v.part.stock_quantity <= 0;
          const tile = (
            <>
              <ValvePicto angle={v.angle} size={32} on={cur} />
              <span className="mt-0.5 text-sm font-extrabold leading-tight text-center" style={{ color: cur ? "#fff" : CARBON }}>{v.valve}</span>
              {v.gamme !== "Standard" && <span className="text-[13px] font-bold leading-tight" style={{ color: cur ? "#DDEBE1" : GREEN }}>{v.gamme}</span>}
              <span className="mt-0.5 text-[13px] font-semibold" style={{ color: cur ? "rgba(255,255,255,0.8)" : out ? "#9CA3AF" : "#6B7280" }}>{out ? "Rupture" : eur(v.part.price)}</span>
            </>
          );
          const cls = "flex flex-col items-center justify-center min-h-[96px] px-1.5 py-2 rounded-lg";
          return cur ? (
            <div key={v.part.id} aria-current="true" className={cls} style={{ background: CARBON, fontFamily: FONT }}>{tile}</div>
          ) : (
            <Link key={v.part.id} to={`/piece/${v.part.slug}`} replace className={`${cls} transition-colors hover:bg-[#EFEAE0]`}
              style={{ background: "#fff", boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>{tile}</Link>
          );
        })}
      </div>
    </div>
  );
};

export default VariantPicker;
