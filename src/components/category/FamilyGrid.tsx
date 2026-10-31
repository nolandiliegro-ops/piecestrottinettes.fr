/**
 * Grille par FAMILLES (31/10/2026) — une carte par taille, les valves et gammes à l'intérieur.
 * 5 propositions derrière ?familles=1..5 (sans paramètre : grille d'avant, une carte par pièce).
 * 1 Pastilles · 2 Dès · 3 Repassé · 4 Pictos · 5 Comparateur.
 * Le panier reste au `parts.id` de la variante choisie : rien ne change côté paiement.
 */
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, X, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { getPrimaryImage } from "@/lib/entityImage";
import { optimizedImage } from "@/lib/imageTransform";
import { SHOP_OPEN, openPrelaunch } from "@/config/launch";
import { FAMILY_SORTS, type FamilySort, type FamilyVariant, type PartFamily } from "@/lib/partFamilies";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const BEBAS = "'Bebas Neue', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const ORANGE = "#FF6600";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)";

export const readFamillesLook = (): number => {
  try {
    const n = Number(new URLSearchParams(window.location.search).get("familles"));
    return n >= 1 && n <= 5 ? n : 0;
  } catch {
    return 0;
  }
};

const eur = (n: number | null) => (n == null ? "—" : n.toFixed(2).replace(".", ","));
const imgOf = (v: FamilyVariant) => optimizedImage(getPrimaryImage(v.part.images as never, v.part.image_url, ""), 400);
const inStock = (v: FamilyVariant) => (v.part.stock_quantity ?? 1) > 0 && v.part.price != null;

/** Petit dessin de la valve : droite, ou coudée selon ses angles. Aide à reconnaître la sienne. */
export const ValvePicto = ({ angle, size = 34, on = false }: { angle: [number, number] | null; size?: number; on?: boolean }) => {
  const c = on ? "#fff" : CARBON;
  // « 0×90 » : la valve se couche le long de la jante → on dessine le 2e angle quand le 1er vaut 0.
  const a = angle ? Math.min(angle[0] || angle[1], 150) : 0;
  const rad = (a * Math.PI) / 180;
  const x1 = 20, y1 = 22; // coude
  const x2 = x1 + Math.sin(rad) * 11, y2 = y1 - Math.cos(rad) * 11;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <path d="M4 36 Q20 28 36 36" fill="none" stroke={on ? "rgba(255,255,255,0.55)" : "#B9B1A2"} strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="32" x2={x1} y2={y1} stroke={c} strokeWidth="3.2" strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="3.2" strokeLinecap="round" />
      <circle cx={x2} cy={y2} r="2.6" fill={on ? "#fff" : ORANGE} />
    </svg>
  );
};

const useAdd = () => {
  const { addItem, setIsOpen } = useCart();
  return (v: FamilyVariant, e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!SHOP_OPEN) { openPrelaunch(); return; }
    if (!inStock(v)) return;
    addItem({ id: v.part.id, name: v.part.name, price: v.part.price as number, image_url: getPrimaryImage(v.part.images as never, v.part.image_url, "") || v.part.image_url, stock_quantity: v.part.stock_quantity || 0 });
    toast.success(`${v.part.name} — ajoutée au panier`, { action: { label: "Voir", onClick: () => setIsOpen(true) } });
  };
};

const Price = ({ n, from = false, big = 34 }: { n: number | null; from?: boolean; big?: number }) => {
  const [i, d] = eur(n).split(",");
  return (
    <span className="inline-flex items-baseline gap-1" style={{ color: CARBON, lineHeight: 0.9 }}>
      {from && <span className="text-sm font-bold text-gray-500" style={{ fontFamily: FONT }}>dès</span>}
      <span style={{ fontFamily: BEBAS }}><span style={{ fontSize: big }}>{i}</span><span style={{ fontSize: big * 0.56 }}>,{d}</span><span style={{ fontSize: big * 0.5, marginLeft: 3 }}>€</span></span>
    </span>
  );
};

const AddBtn = ({ onClick, label = "Ajouter", disabled = false }: { onClick: (e: MouseEvent) => void; label?: string; disabled?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className="relative z-10 mt-3 min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl text-white font-bold text-sm active:scale-[0.97] transition disabled:opacity-40"
    style={{ background: ORANGE, fontFamily: FONT }}>
    <ShoppingCart className="w-4 h-4" /> <span className="uppercase tracking-wide">{label}</span>
  </button>
);

const Cat = () => <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: GREEN, fontFamily: FONT }}>Chambres à air</p>;
const Title = ({ f, to }: { f: PartFamily; to: string }) => (
  <Link to={to} className="block text-base font-bold leading-snug hover:underline" style={{ color: CARBON, fontFamily: FONT }}>
    {f.title}{f.rim ? <span className="font-semibold text-gray-500"> · {f.rim}</span> : null}
  </Link>
);
const Photo = ({ v, h = 150 }: { v: FamilyVariant; h?: number }) => (
  <div className="flex items-center justify-center" style={{ height: h }}>
    <img src={imgOf(v)} alt={v.part.name} loading="lazy" className="max-h-full max-w-[88%] object-contain" />
  </div>
);
const Stock = ({ v }: { v: FamilyVariant }) => (
  <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: inStock(v) ? GREEN : "#9CA3AF", fontFamily: FONT }}>
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: inStock(v) ? GREEN : "#9CA3AF" }} />{inStock(v) ? "En stock" : "Rupture"}
  </span>
);
const Shell = ({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) => (
  <div className={`relative min-w-0 flex flex-col bg-white rounded-xl p-4 border border-[#ECE7DD] shadow-[0_6px_18px_-12px_rgba(26,26,26,0.25)] ${wide ? "col-span-2" : ""}`}>{children}</div>
);
const summary = (f: PartFamily) => {
  const valves = new Set(f.variants.map((v) => v.valve)).size;
  const gammes = new Set(f.variants.map((v) => v.gamme)).size;
  return `${valves} valve${valves > 1 ? "s" : ""}${gammes > 1 ? ` · ${gammes} gammes` : ""}`;
};
const gammeTag = (v: FamilyVariant) => (v.gamme === "Standard" ? null : (
  <span className="ml-1 px-1.5 py-0.5 text-[12px] font-extrabold uppercase tracking-wide rounded" style={{ background: v.gamme === "Premium" ? CARBON : "#EEF4F0", color: v.gamme === "Premium" ? "#fff" : GREEN, fontFamily: FONT }}>{v.gamme}</span>
));

/* ─── Fenêtre de choix (2 · Dès et 3 · Repassé) ─── */
const VariantSheet = ({ f, onClose }: { f: PartFamily; onClose: () => void }) => {
  const add = useAdd();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const o = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = o; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center" role="dialog" aria-modal aria-label={`Choisir la valve — ${f.title}`}>
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full md:max-w-lg bg-[#FAFAF8] max-h-[88vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-5 pb-8">
        <div className="flex items-start gap-3">
          <img src={imgOf(f.variants[0])} alt="" className="w-16 h-16 object-contain bg-white rounded-lg p-1" />
          <div className="flex-1 min-w-0">
            <p className="text-lg uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{f.title}</p>
            <p className="mt-1 text-sm text-gray-600" style={{ fontFamily: FONT }}>Regarde comment sort ta valve actuelle : droite, ou coudée (et de combien).</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>
        <ul className="mt-4 space-y-2">
          {f.variants.map((v) => (
            <li key={v.part.id} className="flex items-center gap-3 bg-white px-3 py-2.5" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
              <ValvePicto angle={v.angle} />
              <Link to={`/piece/${v.part.slug}`} className="flex-1 min-w-0" onClick={onClose}>
                <span className="block text-base font-extrabold" style={{ fontFamily: FONT, color: CARBON }}>{v.valve}{gammeTag(v)}</span>
                <Stock v={v} />
              </Link>
              <Price n={v.part.price} big={26} />
              <button type="button" onClick={(e) => { add(v, e); onClose(); }} disabled={!inStock(v)} aria-label={`Ajouter ${v.part.name}`}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-white disabled:opacity-40" style={{ background: ORANGE }}>
                <ShoppingCart className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* ─── Carte d'une famille à une seule variante : identique pour les 5 propositions ─── */
const SingleCard = ({ f }: { f: PartFamily }) => {
  const v = f.variants[0];
  const add = useAdd();
  const to = `/piece/${v.part.slug}`;
  return (
    <Shell>
      <Link to={to}><Photo v={v} /></Link>
      <div className="mt-3 flex-1"><Cat /><Title f={f} to={to} /><p className="text-sm text-gray-600" style={{ fontFamily: FONT }}>Valve {v.valve.toLowerCase()}{v.gamme !== "Standard" ? ` · ${v.gamme.toLowerCase()}` : ""}</p></div>
      <div className="mt-2 flex items-baseline justify-between gap-2"><Price n={v.part.price} /><Stock v={v} /></div>
      <AddBtn onClick={(e) => add(v, e)} disabled={!inStock(v)} />
    </Shell>
  );
};

/* 1 · PASTILLES — le choix de valve directement sur la carte, le prix suit. */
const CardPastilles = ({ f }: { f: PartFamily }) => {
  const [sel, setSel] = useState<number | null>(null);
  const [nudge, setNudge] = useState(false);
  const add = useAdd();
  const v = sel != null ? f.variants[sel] : f.variants[0];
  const to = `/piece/${v.part.slug}`;
  return (
    <Shell>
      <Link to={to}><Photo v={v} h={130} /></Link>
      <div className="mt-3"><Cat /><Title f={f} to={to} /></div>
      <p className="mt-2 text-sm font-bold" style={{ fontFamily: FONT, color: nudge ? ORANGE : "#6B7280" }}>{nudge ? "Choisis ta valve ↓" : "Ta valve"}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {f.variants.map((x, i) => (
          <button key={x.part.id} type="button" onClick={() => { setSel(i); setNudge(false); }} aria-pressed={sel === i}
            className="min-h-[36px] px-2.5 text-sm font-extrabold rounded-lg transition-colors"
            style={{ fontFamily: FONT, background: sel === i ? CARBON : "#fff", color: sel === i ? "#fff" : CARBON, boxShadow: sel === i ? "none" : `inset 0 0 0 1px ${nudge ? ORANGE : LINE}` }}>
            {x.valve}{x.gamme !== "Standard" ? ` · ${x.gamme === "Premium" ? "Prem." : "Renf."}` : ""}
          </button>
        ))}
      </div>
      <div className="mt-auto pt-3 flex items-baseline justify-between gap-2"><Price n={sel != null ? v.part.price : f.minPrice} from={sel == null && f.minPrice !== f.maxPrice} />{sel != null && <Stock v={v} />}</div>
      <AddBtn onClick={(e) => { if (sel == null) { e.preventDefault(); setNudge(true); return; } add(v, e); }} disabled={sel != null && !inStock(v)} />
    </Shell>
  );
};

/* 2 · DÈS — carte épurée « dès 9,90 € · 8 valves », le choix dans une fenêtre. */
const CardDes = ({ f }: { f: PartFamily }) => {
  const [open, setOpen] = useState(false);
  const v = f.variants[0];
  const to = `/piece/${v.part.slug}`;
  return (
    <Shell>
      <Link to={to}><Photo v={v} /></Link>
      <div className="mt-3 flex-1"><Cat /><Title f={f} to={to} /></div>
      <div className="mt-2 flex items-center gap-1" aria-hidden>{f.variants.slice(0, 6).map((x) => <ValvePicto key={x.part.id} angle={x.angle} size={22} />)}</div>
      <p className="text-sm font-bold text-gray-600" style={{ fontFamily: FONT }}>{summary(f)}</p>
      <div className="mt-2"><Price n={f.minPrice} from={f.minPrice !== f.maxPrice} /></div>
      <AddBtn onClick={(e) => { e.preventDefault(); setOpen(true); }} label="Choisir ma valve" />
      {open && <VariantSheet f={f} onClose={() => setOpen(false)} />}
    </Shell>
  );
};

/* 3 · REPASSÉ — la carte d'aujourd'hui à l'identique, une ligne « + N autres valves », Ajouter ouvre le choix. */
const CardRepasse = ({ f }: { f: PartFamily }) => {
  const [open, setOpen] = useState(false);
  const v = f.variants[0];
  const to = `/piece/${v.part.slug}`;
  return (
    <Shell>
      <Link to={to}><Photo v={v} /></Link>
      <div className="mt-3 flex-1"><Cat /><Title f={f} to={to} /></div>
      <button type="button" onClick={() => setOpen(true)} className="mt-1 self-start inline-flex items-center gap-1 min-h-[36px] text-sm font-bold underline" style={{ color: GREEN, fontFamily: FONT }}>
        {summary(f)} <ChevronRight className="w-4 h-4" />
      </button>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1"><Price n={f.minPrice} from={f.minPrice !== f.maxPrice} /><Stock v={v} /></div>
      <AddBtn onClick={(e) => { e.preventDefault(); setOpen(true); }} />
      {open && <VariantSheet f={f} onClose={() => setOpen(false)} />}
    </Shell>
  );
};

/* 4 · PICTOS — chaque valve dessinée, on touche celle qui ressemble à la sienne. */
const CardPictos = ({ f }: { f: PartFamily }) => {
  const [sel, setSel] = useState<number | null>(null);
  const add = useAdd();
  const v = sel != null ? f.variants[sel] : f.variants[0];
  const to = `/piece/${v.part.slug}`;
  return (
    <Shell>
      <div className="flex gap-2 items-center min-w-0">
        <Link to={to} className="shrink-0 w-12 md:w-20"><Photo v={v} h={56} /></Link>
        <div className="min-w-0"><Title f={f} to={to} /></div>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-1.5">
        {f.variants.map((x, i) => (
          <button key={x.part.id} type="button" onClick={() => setSel(i)} aria-pressed={sel === i} aria-label={`Valve ${x.valve} ${x.gamme}`}
            className="flex flex-col items-center justify-center min-h-[72px] px-1 py-1.5 rounded-lg"
            style={{ background: sel === i ? GREEN : "#F6F3EC", boxShadow: sel === i ? "none" : `inset 0 0 0 1px ${LINE}` }}>
            <ValvePicto angle={x.angle} size={30} on={sel === i} />
            <span className="mt-0.5 text-[13px] leading-tight font-extrabold text-center" style={{ fontFamily: FONT, color: sel === i ? "#fff" : CARBON }}>{x.valve.replace(" mm", "")}</span>
            {x.gamme !== "Standard" && <span className="text-[12px] font-bold leading-none" style={{ fontFamily: FONT, color: sel === i ? "#DDEBE1" : GREEN }}>{x.gamme === "Premium" ? "Premium" : "Renforcée"}</span>}
          </button>
        ))}
      </div>
      <div className="mt-auto pt-3 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1"><Price n={sel != null ? v.part.price : f.minPrice} from={sel == null && f.minPrice !== f.maxPrice} />{sel != null ? <Stock v={v} /> : <span className="text-sm text-gray-500" style={{ fontFamily: FONT }}>Touche ta valve</span>}</div>
      <AddBtn onClick={(e) => { if (sel == null) { e.preventDefault(); return; } add(v, e); }} disabled={sel == null || !inStock(v)} />
    </Shell>
  );
};

/* 5 · COMPARATEUR — carte large, une ligne par valve avec son prix et son bouton. */
const CardComparateur = ({ f }: { f: PartFamily }) => {
  const add = useAdd();
  const v0 = f.variants[0];
  return (
    <Shell wide>
      <div className="flex gap-3 items-center">
        <Link to={`/piece/${v0.part.slug}`} className="shrink-0 w-20 md:w-28"><Photo v={v0} h={84} /></Link>
        <div className="min-w-0"><Cat /><Title f={f} to={`/piece/${v0.part.slug}`} /><p className="text-sm text-gray-600" style={{ fontFamily: FONT }}>{summary(f)}</p></div>
      </div>
      <ul className="mt-3 divide-y divide-[#ECE7DD] border-t border-[#ECE7DD]">
        {f.variants.map((x) => (
          <li key={x.part.id} className="flex items-center gap-2 py-1.5">
            <ValvePicto angle={x.angle} size={28} />
            <Link to={`/piece/${x.part.slug}`} className="flex-1 min-w-0 text-sm font-extrabold truncate" style={{ fontFamily: FONT, color: CARBON }}>{x.valve}{gammeTag(x)}</Link>
            <Price n={x.part.price} big={24} />
            <button type="button" onClick={(e) => add(x, e)} disabled={!inStock(x)} aria-label={`Ajouter ${x.part.name}`}
              className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl text-white disabled:opacity-40" style={{ background: ORANGE }}>
              <ShoppingCart className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </Shell>
  );
};

const CARDS = [null, CardPastilles, CardDes, CardRepasse, CardPictos, CardComparateur];

export const FamilySortBar = ({ sort, onSort }: { sort: FamilySort; onSort: (s: FamilySort) => void }) => (
  <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
    <span className="shrink-0 text-sm font-bold uppercase tracking-[0.14em] text-gray-500" style={{ fontFamily: FONT }}>Trier</span>
    {FAMILY_SORTS.map((s) => (
      <button key={s.value} type="button" onClick={() => onSort(s.value)} aria-pressed={sort === s.value}
        className="shrink-0 h-11 px-3.5 text-sm font-extrabold" style={{ fontFamily: FONT, clipPath: CHAMFER, background: sort === s.value ? CARBON : "#fff", color: sort === s.value ? "#fff" : CARBON, boxShadow: sort === s.value ? "none" : `inset 0 0 0 1px ${LINE}` }}>
        {sort === s.value && <Check className="inline w-4 h-4 mr-1 -mt-0.5" strokeWidth={3} />}{s.label}
      </button>
    ))}
  </div>
);

const FamilyGrid = ({ families, look }: { families: PartFamily[]; look: number }) => {
  const Card = useMemo(() => CARDS[look] ?? CardDes, [look]);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
      {families.map((f) => (f.variants.length === 1 ? <SingleCard key={f.key} f={f} /> : <Card key={f.key} f={f} />))}
    </div>
  );
};

export default FamilyGrid;
