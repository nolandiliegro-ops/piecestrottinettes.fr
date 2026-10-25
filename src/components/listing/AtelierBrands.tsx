/** /marques — gabarit « Atelier » (17/10/2026) : même squelette que /catalogue, vignettes = photos de marque.
 *  Filtres (retour Nolan 17/10 : « dans marque, j'ai aucun filtre ») :
 *   - Usage : Performance, Autonomie, Tout-terrain, Confort, Petit prix, Léger. Même règle que l'ancien mur :
 *     classement par le score du meilleur modèle de la marque sur cet axe, marques sous 50 % du meilleur score masquées,
 *     marques sponsorisées épinglées en tête.
 *   - Origine (pays), tri (les plus fournies / A → Z), recherche. */
import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useBrandWall, AXIS_UI, type BrandAxis, type BrandWallItem } from "@/hooks/useBrandWall";
import { useBrands } from "@/hooks/useScooterData";
import { AtelierHead, PhotoTile, brandPhoto } from "@/components/listing/Atelier";

const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)";
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const RATIO = 0.5;
const AXES = Object.keys(AXIS_UI) as BrandAxis[];

const Plate = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} aria-pressed={on} className="shrink-0 inline-flex items-center gap-1.5 h-11 px-4 text-sm font-extrabold uppercase tracking-wide whitespace-nowrap"
    style={{ fontFamily: FONT, clipPath: CHAMFER, background: on ? CARBON : "#fff", color: on ? "#fff" : CARBON, boxShadow: on ? `inset 0 -3px 0 ${GREEN}` : `inset 0 0 0 1px ${LINE}` }}>
    {children}
  </button>
);

const AtelierBrands = () => {
  const { data: wall = [], isLoading } = useBrandWall();
  const { data: rows = [] } = useBrands();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"fournies" | "az">("fournies");
  const [axis, setAxis] = useState<BrandAxis | null>(null);
  const [country, setCountry] = useState<string>("");
  const hero = useMemo(() => new Map((rows as { slug: string; hero_image_url: string | null }[]).map((r) => [r.slug, r.hero_image_url])), [rows]);
  const base = useMemo(() => wall.filter((b) => b.models_count > 0), [wall]);
  const countries = useMemo(() => {
    const m = new Map<string, number>();
    base.forEach((b) => b.country && m.set(b.country, (m.get(b.country) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"));
  }, [base]);

  const list = useMemo((): BrandWallItem[] => {
    const nq = norm(q.trim());
    let l = base.filter((b) => (!nq || norm(b.name).includes(nq)) && (!country || b.country === country));
    if (axis) {
      const sc = (b: BrandWallItem) => b.champions[axis]?.score ?? null;
      const cmp = (a: BrandWallItem, c: BrandWallItem) => (sc(c) ?? -1) - (sc(a) ?? -1) || a.name.localeCompare(c.name, "fr");
      const organic = l.filter((b) => !b.sponsored && sc(b) !== null);
      const max = organic.length ? Math.max(...organic.map((b) => sc(b)!)) : 0;
      l = [...l.filter((b) => b.sponsored).sort(cmp), ...organic.filter((b) => sc(b)! >= max * RATIO).sort(cmp)];
      return l;
    }
    return sort === "az" ? [...l].sort((a, b) => a.name.localeCompare(b.name, "fr")) : [...l].sort((a, b) => b.models_count - a.models_count || a.name.localeCompare(b.name, "fr"));
  }, [base, q, sort, axis, country]);

  const active = !!axis || !!country || !!q;
  return (
    <section className="px-4 lg:px-8 pt-6 pb-14" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="mx-auto max-w-7xl">
        <AtelierHead title="Marques" n={isLoading ? null : list.length} unit={list.length === base.length ? "marques" : `sur ${base.length}`} query={q} onQuery={setQ} placeholder="Ta marque : Xiaomi, Kaabo…" />

        <p className="mt-5 mb-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-500" style={{ fontFamily: FONT }}>Ton usage</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap" style={{ scrollbarWidth: "none" }}>
          {AXES.map((k) => <Plate key={k} on={axis === k} onClick={() => setAxis(axis === k ? null : k)}>{AXIS_UI[k].label}</Plate>)}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="relative inline-flex items-center">
            <span className="sr-only">Origine</span>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="appearance-none h-11 pl-4 pr-10 text-sm font-extrabold uppercase tracking-wide outline-none"
              style={{ fontFamily: FONT, clipPath: CHAMFER, background: country ? CARBON : "#fff", color: country ? "#fff" : CARBON, boxShadow: country ? `inset 0 -3px 0 ${GREEN}` : `inset 0 0 0 1px ${LINE}` }}>
              <option value="">Origine : toutes</option>
              {countries.map(([c, n]) => <option key={c} value={c}>{c} ({n})</option>)}
            </select>
            <ChevronDown className={`absolute right-3 w-4 h-4 pointer-events-none ${country ? "text-white/80" : "text-gray-500"}`} />
          </label>
          {!axis && (
            <>
              <Plate on={sort === "fournies"} onClick={() => setSort("fournies")}>Les plus fournies</Plate>
              <Plate on={sort === "az"} onClick={() => setSort("az")}>A → Z</Plate>
            </>
          )}
          {active && (
            <button type="button" onClick={() => { setAxis(null); setCountry(""); setQ(""); }} className="inline-flex items-center gap-1.5 min-h-[44px] px-2 text-sm font-bold underline" style={{ fontFamily: FONT, color: CARBON }}>
              <X className="w-4 h-4" /> Tout effacer
            </button>
          )}
        </div>
        {axis && (
          <p className="mt-3 text-sm text-gray-600" style={{ fontFamily: FONT }}>
            Classées par le meilleur modèle de chaque marque en {AXIS_UI[axis].label.toLowerCase()}.
          </p>
        )}

        {list.length === 0 && !isLoading ? (
          <p className="py-10 text-base text-gray-600" style={{ fontFamily: FONT }}>Aucune marque avec ces critères.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {list.map((b) => {
              const champ = axis ? b.champions[axis] : null;
              return (
                <PhotoTile key={b.slug} to={`/marque/${b.slug}`} img={brandPhoto({ slug: b.slug, hero_image_url: hero.get(b.slug) })} name={b.name} n={b.models_count}
                  logo={b.logo_url} sub={champ ? `Top : ${champ.name}` : b.country ?? undefined} className="w-full aspect-[4/3]" />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default AtelierBrands;
