import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { Package, ArrowRight, HelpCircle, Ban, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ScooterCompatiblePart } from "@/hooks/useScooterDetail";
import { useCategories } from "@/hooks/useScooterData";
import { unverifiedLabel } from "@/lib/compatibilityStatus";
import { tubesCatalogueUrl } from "@/components/pdp/CompatibilityMatrix";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PartCard from "@/components/parts/PartCard";
import TireSizeFinder from "@/components/scooter/TireSizeFinder";

interface CompatiblePartsGridProps {
  parts: ScooterCompatiblePart[];
  isLoading: boolean;
  scooterName: string;
  /** Trotte pneumatique déclarée « ne passe pas en pneus pleins » (16/09). */
  solidBlocked?: boolean;
  scooterId?: string;
  /**
   * 17/10 (soir) — propositions de mise en page (?pieces=1..4), quand la page porte aussi la fiche « Tout savoir » :
   * grid = grille complète (actuel) · rail = carrousel une ligne + familles en filtre + « Tout voir »
   * · familles = tuiles par famille (renvoient à la grille complète plus bas) · courte = grille limitée à 2 rangées + « Tout voir ».
   */
  layout?: "grid" | "rail" | "familles" | "courte";
  /** Ancre de la grille complète quand les tuiles « familles » y renvoient. */
  fullGridId?: string;
  /** Titre de section (la grille complète sous les tuiles « familles » ne répète pas « Pièces compatibles »). */
  title?: string;
}

// Familles qui vendent (forte marge) d'abord, puis les autres par nombre de pièces.
const FAMILY_ORDER = ["pneus", "chambres-a-air", "plaquettes", "plaquettes-de-frein", "chargeurs", "pneus-pleins", "disques", "disques-de-frein", "disques-plaquettes"];
type Fam = { slug: string; name: string; parts: ScooterCompatiblePart[]; from: number | null; img: string | null };
const familiesOf = (parts: ScooterCompatiblePart[]): Fam[] => {
  const m = new Map<string, Fam>();
  for (const p of parts) {
    const slug = p.category?.slug ?? "autres";
    const f = m.get(slug) ?? { slug, name: p.category?.name ?? "Autres", parts: [], from: null, img: null };
    f.parts.push(p);
    if (p.price != null && p.price > 0) f.from = f.from == null ? p.price : Math.min(f.from, p.price);
    if (!f.img && p.image_url) f.img = p.image_url;
    m.set(slug, f);
  }
  const rank = (s: string) => { const i = FAMILY_ORDER.indexOf(s); return i < 0 ? 99 : i; };
  return [...m.values()].sort((a, b) => rank(a.slug) - rank(b.slug) || b.parts.length - a.parts.length);
};
const euro = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €";
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";

const Chips = ({ fams, total, value, onChange }: { fams: Fam[]; total: number; value: string; onChange: (v: string) => void }) => (
  <div className="-mx-4 px-4 lg:mx-0 lg:px-0 flex gap-2 overflow-x-auto pb-1 mb-5 [scrollbar-width:none]" role="tablist" aria-label="Familles de pièces">
    {[{ slug: "all", name: "Tout", n: total }, ...fams.map((f) => ({ slug: f.slug, name: f.name, n: f.parts.length }))].map((c) => (
      <button key={c.slug} type="button" role="tab" aria-selected={value === c.slug} onClick={() => onChange(c.slug)}
        className="shrink-0 min-h-[44px] px-4 text-sm font-extrabold uppercase tracking-wider"
        style={{ clipPath: CHAMFER, background: value === c.slug ? "#1A1A1A" : "#fff", color: value === c.slug ? "#fff" : "#1A1A1A", boxShadow: value === c.slug ? "none" : "inset 0 0 0 1px #E2DCD0" }}>
        {c.name} <span className={value === c.slug ? "opacity-70" : "text-gray-500"}>{c.n}</span>
      </button>
    ))}
  </div>
);

const Rail = ({ parts, scooterName }: { parts: ScooterCompatiblePart[]; scooterName: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const slide = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={ref} className="-mx-4 px-4 lg:mx-0 lg:px-0 pt-6 -mt-6 flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-3 [scrollbar-width:none]">
        {parts.map((part, i) => (
          <div key={part.id} className="snap-start shrink-0 w-[46%] sm:w-[31%] lg:w-[calc(25%-15px)]">
            <PartCard hideCompat part={{ ...part, description: null }} index={i} position={part.position} />
            {part.status === "unverified" && <p className="text-sm text-muted-foreground mt-2 px-1">{unverifiedLabel(part.reason)}</p>}
          </div>
        ))}
      </div>
      {parts.length > 4 && (["l", "r"] as const).map((k) => (
        <button key={k} type="button" aria-label={k === "l" ? "Pièces précédentes" : `Pièces suivantes pour ta ${scooterName}`} onClick={() => slide(k === "l" ? -1 : 1)}
          className={`hidden lg:flex absolute top-[38%] ${k === "l" ? "-left-5" : "-right-5"} w-11 h-11 items-center justify-center rounded-full bg-[#1A1A1A] text-white shadow-lg`}>
          {k === "l" ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );
};

const CompatiblePartsGrid = ({
  parts,
  isLoading,
  scooterName,
  solidBlocked = false,
  scooterId,
  layout = "grid",
  fullGridId,
  title = "PIÈCES COMPATIBLES",
}: CompatiblePartsGridProps) => {
  const fams = useMemo(() => familiesOf(parts), [parts]);
  const [fam, setFam] = useState("all");
  const [expanded, setExpanded] = useState(false);
  // LOT 3 — ventilation via la règle unique (statut déjà posé par le hook) :
  // ✅ verified en grille ; 🟡 unverified en SECTION SÉPARÉE sous la grille,
  // libellé sous chaque card (jamais de badge) ; 🔵 zéro affichable → CTA contact.
  const verified = parts.filter((p) => p.status === "verified");
  const unverified = parts.filter((p) => p.status === "unverified");

  // Encart « ne passe pas en pneus pleins » : hors grille, hors section 🟡,
  // jamais un badge. Il explique l'absence de la catégorie et renvoie vers
  // les chambres renforcées / anti-crevaison.
  const { data: categories = [] } = useCategories();
  const tubesCategoryId = categories.find((c) => c.slug === "chambres-a-air")?.id;

  if (isLoading) {
    return (
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 lg:py-16 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-primary" />
              <h2 className="font-display text-3xl lg:text-4xl text-foreground">
                {title}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {parts.length} pièce{parts.length > 1 ? "s" : ""} détachée{parts.length > 1 ? "s" : ""} compatible{parts.length > 1 ? "s" : ""} avec votre {scooterName}
            </p>
          </div>

          <Link to="/catalogue">
            <Button variant="outline" className="gap-2 group">
              Voir tout le catalogue
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>

        {/* 18/10 (Nolan : « trop texte, intrusif ») : une ligne discrète, l'explication s'ouvre au clic. */}
        {solidBlocked && (
          <details className="group mb-5 inline-block max-w-full">
            <summary className="list-none cursor-pointer inline-flex items-center gap-2 min-h-[44px] px-3 rounded-full bg-white border border-border text-sm font-semibold text-foreground">
              <Ban className="w-4 h-4 flex-shrink-0" /> Pas de pneus pleins sur ce modèle
              <span className="text-muted-foreground font-normal underline underline-offset-2">Pourquoi ?</span>
            </summary>
            <div className="mt-2 max-w-md rounded-xl border border-border bg-white p-4 shadow-md">
              <p className="text-sm text-muted-foreground leading-snug">
                D'après notre atelier, un pneu plein n'est pas adapté à ce modèle. Contre les crevaisons, passe sur une chambre renforcée ou anti-crevaison.
              </p>
              <Link to={tubesCatalogueUrl(tubesCategoryId, scooterId)} className="mt-3 inline-flex items-center gap-2 min-h-[44px] text-sm font-semibold text-foreground underline underline-offset-2">
                Voir les chambres anti-crevaison <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </details>
        )}

        {/* 17/10 (soir) : mises en page compactes, la grille complète reste un clic plus loin */}
        {parts.length > 0 && layout === "rail" && !expanded && (
          <>
            <Chips fams={fams} total={parts.length} value={fam} onChange={setFam} />
            <Rail parts={fam === "all" ? [...verified, ...unverified] : fams.find((f) => f.slug === fam)?.parts ?? []} scooterName={scooterName} />
          </>
        )}
        {parts.length > 0 && layout === "familles" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {fams.map((f) => (
              <a key={f.slug} href={`#${fullGridId ?? "toutes-les-pieces"}`} className="group bg-white flex flex-col min-h-[44px] transition-transform hover:-translate-y-0.5"
                style={{ clipPath: CHAMFER, boxShadow: "inset 0 0 0 1px #E2DCD0, inset 0 -4px 0 #4A7C59" }}>
                <div className="aspect-[4/3] bg-[#F5F0E8] flex items-center justify-center p-3">
                  {f.img ? <img src={f.img} alt="" loading="lazy" className="max-h-full max-w-full object-contain mix-blend-multiply" /> : <Package className="w-10 h-10 text-gray-400" />}
                </div>
                <div className="p-3 pb-4">
                  <div className="text-base font-extrabold uppercase leading-tight text-[#1A1A1A]">{f.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{f.parts.length} réf.{f.from != null && <> · dès <span className="font-bold text-[#1A1A1A]">{euro(f.from)}</span></>}</div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Parts Grid — PartCard catalogue (design unique site) */}
        {(layout === "rail" || layout === "familles") && !expanded ? null : verified.length > 0 || unverified.length > 0 ? (
          <>
            {verified.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
                {(layout === "courte" && !expanded ? verified.slice(0, 8) : verified).map((part, index) => (
                  <PartCard
                    hideCompat
                    key={part.id}
                    part={{ ...part, description: null }}
                    index={index}
                    position={part.position}
                  />
                ))}
              </div>
            )}

            {unverified.length > 0 && !(layout === "courte" && !expanded) && (
              <div className="mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-display text-xl text-foreground">
                    À vérifier pour ta {scooterName}
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
                  {unverified.map((part, index) => (
                    <div key={part.id}>
                      <PartCard
                        hideCompat
                        part={{ ...part, description: null }}
                        index={index}
                        position={part.position}
                      />
                      <p className="text-sm text-muted-foreground mt-2 px-1">
                        {unverifiedLabel(part.reason)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-card rounded-2xl border border-border"
          >
            <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-display text-2xl text-foreground mb-2">
              On te la trouve
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Aucune pièce vérifiée pour ta {scooterName} pour l'instant — dis-nous
              ce que tu cherches, on la trouve pour toi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center min-h-[44px] bg-green-700 hover:bg-green-800 text-white rounded-lg px-6 py-3 font-semibold text-sm transition-colors gap-2"
              >
                Demander une pièce
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/catalogue">
                <Button variant="outline" className="gap-2 min-h-[44px]">
                  Explorer le catalogue
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {!expanded && ((layout === "rail" && parts.length > 4) || (layout === "courte" && parts.length > 8)) && (
          <div className="mt-6 flex justify-center">
            <button type="button" onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-2 min-h-[48px] px-6 text-sm font-extrabold uppercase tracking-wider text-white"
              style={{ background: "#1A1A1A", clipPath: CHAMFER }}>
              Voir les {parts.length} pièces <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 17/10 : aucun pneu / chambre relié → le client lit sa taille sur le flanc du pneu */}
        {!parts.some((p) => ["pneus", "chambres-a-air", "pneus-pleins"].includes(p.category?.slug ?? "")) && (
          <TireSizeFinder scooterId={scooterId} scooterName={scooterName} />
        )}
      </div>
    </section>
  );
};

export default CompatiblePartsGrid;
