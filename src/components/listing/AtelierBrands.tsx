/** /marques?vue=atelier — maquette du 17/10/2026 : même squelette que /catalogue, vignettes = photos de marque. */
import { useMemo, useState } from "react";
import { useBrandWall } from "@/hooks/useBrandWall";
import { useBrands } from "@/hooks/useScooterData";
import { AtelierHead, PhotoTile, brandPhoto } from "@/components/listing/Atelier";

const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)";
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const SORTS = [["fournies", "Les plus fournies"], ["az", "A → Z"]] as const;

const AtelierBrands = () => {
  const { data: wall = [], isLoading } = useBrandWall();
  const { data: rows = [] } = useBrands();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"fournies" | "az">("fournies");
  const hero = useMemo(() => new Map((rows as { slug: string; hero_image_url: string | null }[]).map((r) => [r.slug, r.hero_image_url])), [rows]);
  const list = useMemo(() => {
    const nq = norm(q.trim());
    const l = wall.filter((b) => b.models_count > 0 && (!nq || norm(b.name).includes(nq)));
    return sort === "az" ? [...l].sort((a, b) => a.name.localeCompare(b.name, "fr")) : [...l].sort((a, b) => b.models_count - a.models_count || a.name.localeCompare(b.name, "fr"));
  }, [wall, q, sort]);

  return (
    <section className="px-4 lg:px-8 pt-6 pb-14" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="mx-auto max-w-7xl">
        <AtelierHead title="Marques" n={isLoading ? null : list.length} unit="marques" query={q} onQuery={setQ} placeholder="Ta marque : Xiaomi, Dualtron, Kaabo…" />
        <div className="mt-5 flex gap-2">
          {SORTS.map(([k, label]) => {
            const on = sort === k;
            return (
              <button key={k} type="button" onClick={() => setSort(k)} aria-pressed={on} className="h-11 px-4 text-sm font-extrabold uppercase tracking-wide"
                style={{ fontFamily: FONT, clipPath: CHAMFER, background: on ? CARBON : "#fff", color: on ? "#fff" : CARBON, boxShadow: on ? "none" : `inset 0 0 0 1px ${LINE}` }}>{label}</button>
            );
          })}
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((b) => (
            <PhotoTile key={b.slug} to={`/marque/${b.slug}`} img={brandPhoto({ slug: b.slug, hero_image_url: hero.get(b.slug) })} name={b.name} n={b.models_count}
              logo={b.logo_url} sub={b.country ?? undefined} className="w-full aspect-[4/3]" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AtelierBrands;
