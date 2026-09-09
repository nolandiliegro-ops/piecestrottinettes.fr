import { forwardRef, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, HelpCircle, Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { CompatibleScooter } from "@/hooks/usePartDetail";
import { verifiedGroupLabel, unverifiedGroupLabel } from "@/lib/compatibilityStatus";
import { scooterLabel, scooterLabelShort } from "@/lib/scooterLabel";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { Skeleton } from "@/components/ui/skeleton";
import CompatLeadForm from "@/components/pdp/CompatLeadForm";

interface CompatibilityMatrixProps {
  scooters: CompatibleScooter[];
  isLoading: boolean;
  /** Slug + nom de la pièce : contextualisent le lien « on te la trouve ». */
  partSlug?: string;
  partName?: string;
  /** Id de la pièce : formulaire de lead du bloc « on te la trouve ». */
  partId?: string;
}

interface BrandGroup {
  brand: string;
  items: CompatibleScooter[];
}

/** Regroupe par marque, marques les plus fournies en premier. */
function groupByBrand(list: CompatibleScooter[]): BrandGroup[] {
  const map = new Map<string, CompatibleScooter[]>();
  for (const s of list) {
    const key = s.brand?.name?.trim() || "Autres";
    const bucket = map.get(key);
    if (bucket) bucket.push(s);
    else map.set(key, [s]);
  }
  return [...map.entries()]
    .map(([brand, items]) => ({
      brand,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    }))
    .sort((a, b) => b.items.length - a.items.length || a.brand.localeCompare(b.brand, "fr"));
}

/** Lien de demande de vérification, porteur du contexte de la pièce. */
function askUrl(partSlug?: string, partName?: string, model?: string): string {
  const p = new URLSearchParams();
  if (partSlug) p.set("piece", partSlug);
  if (partName) p.set("nom", partName);
  if (model) p.set("modele", model);
  const qs = p.toString();
  return qs ? `/contact?${qs}` : "/contact";
}

const CTA_CLASS =
  "group relative overflow-hidden inline-flex w-full items-center justify-center gap-2 " +
  "min-h-[52px] px-5 rounded-xl bg-carbon text-white font-display text-base uppercase " +
  "tracking-widest transition-all duration-300 hover:bg-black " +
  "hover:shadow-[0_0_30px_rgba(0,0,0,0.35)] active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon focus-visible:ring-offset-2";

const CTA_SHINE =
  "pointer-events-none absolute top-0 -left-1/2 h-full w-[38%] skew-x-[-18deg] " +
  "bg-gradient-to-r from-transparent via-white/25 to-transparent " +
  "transition-all duration-500 group-hover:left-[120%]";

const CompatibilityMatrix = forwardRef<HTMLDivElement, CompatibilityMatrixProps>(
  function CompatibilityMatrixInner({ scooters, isLoading, partSlug, partName, partId }, ref) {
    // LOT 3 — ventilation via la règle unique (déjà classée par le hook) :
    // ✅ verified groupé par marque ; 🟡 unverified en SECTION SÉPARÉE avec la
    // raison écrite UNE FOIS (jamais un badge, jamais un %) ; 🔵 zéro affichable
    // → « on te la trouve », avec la pièce passée au formulaire de contact.
    const { selectedScooter } = useSelectedScooter();
    const [query, setQuery] = useState("");

    const verified = useMemo(() => scooters.filter((s) => s.status === "verified"), [scooters]);
    const unverified = useMemo(() => scooters.filter((s) => s.status === "unverified"), [scooters]);

    const verifiedGroups = useMemo(() => groupByBrand(verified), [verified]);
    const unverifiedGroups = useMemo(() => groupByBrand(unverified), [unverified]);

    const verifiedNote = useMemo(
      () => verifiedGroupLabel(verified.map((s) => s.reason)),
      [verified],
    );
    const unverifiedNote = useMemo(
      () => unverifiedGroupLabel(unverified.map((s) => s.reason)),
      [unverified],
    );

    // Verdict garage. Sûr par construction : PartDetail a déjà dégradé toutes
    // les lignes en 🟡 quand le voltage de la pièce est hors barème (M-A7a),
    // donc `verified` est vide dans ce cas et aucun ✅ ne peut s'afficher ici.
    const mine = selectedScooter
      ? scooters.find((s) => s.id === selectedScooter.id) ?? null
      : null;

    // Filtre : n'apparaît que quand la liste est réellement longue.
    const filterable = scooters.length > 8;
    const q = query.trim().toLowerCase();
    const matches = (s: CompatibleScooter) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.brand?.name ?? "").toLowerCase().includes(q);

    const shownVerified = q ? groupByBrand(verified.filter(matches)) : verifiedGroups;
    const shownUnverified = q ? groupByBrand(unverified.filter(matches)) : unverifiedGroups;
    const noResult = q.length > 0 && shownVerified.length === 0 && shownUnverified.length === 0;

    // Une seule marque : le déplié permanent évite un clic pour rien.
    const [open, setOpen] = useState<string | null>(
      verifiedGroups.length === 1 ? verifiedGroups[0].brand : null,
    );
    const isOpen = (brand: string, count: number) =>
      Boolean(q) || open === brand || count <= 2;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="h-full bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:p-6 flex flex-col"
      >
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
          <Zap className="w-5 h-5 text-mineral" />
          <h2 className="font-display text-lg uppercase tracking-wide text-carbon">
            Compatibilité
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : verified.length > 0 || unverified.length > 0 ? (
            <div className="space-y-4">
              {mine && mine.status === "verified" && (
                <div className="flex items-start gap-2.5 rounded-xl border border-green-700/25 bg-green-700/10 p-3">
                  <CheckCircle2 className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-carbon leading-snug">
                      Compatible avec ta {scooterLabel(mine.brand?.name, mine.name)}
                    </p>
                    <p className="text-sm text-carbon/60 leading-snug mt-0.5">
                      Tu peux commander.
                    </p>
                  </div>
                </div>
              )}
              {mine && mine.status === "unverified" && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/70 p-3">
                  <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-carbon leading-snug">
                      À vérifier pour ta {scooterLabel(mine.brand?.name, mine.name)}
                    </p>
                    <p className="text-sm text-carbon/60 leading-snug mt-0.5">
                      {unverifiedNote}
                    </p>
                  </div>
                </div>
              )}
              {selectedScooter && !mine && (
                <div className="rounded-xl border border-carbon/10 bg-carbon/[0.04] p-3">
                  <p className="text-sm font-semibold text-carbon leading-snug">
                    Pas encore vérifiée pour ta {selectedScooter.brandName}{" "}
                    {scooterLabelShort(selectedScooter.brandName, selectedScooter.name)}
                  </p>
                  <Link
                    to={askUrl(partSlug, partName, `${selectedScooter.brandName} ${selectedScooter.name}`)}
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-carbon underline underline-offset-4 min-h-[44px]"
                  >
                    On vérifie pour toi
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {filterable && (
                <div className="flex items-center gap-2 h-12 rounded-xl border border-carbon/15 bg-white px-3">
                  <Search className="w-4 h-4 text-carbon/40 flex-shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cherche ta trottinette"
                    aria-label="Chercher une trottinette dans la liste"
                    className="w-full bg-transparent text-base text-carbon placeholder:text-carbon/35 outline-none"
                  />
                </div>
              )}

              {noResult && (
                <div className="rounded-xl border border-carbon/10 bg-carbon/[0.04] p-3">
                  <p className="text-sm text-carbon/70 leading-snug">
                    Aucune trottinette de la liste ne correspond à « {query.trim()} ».
                  </p>
                  <Link
                    to={askUrl(partSlug, partName, query.trim())}
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-carbon underline underline-offset-4 min-h-[44px]"
                  >
                    Demande-nous quand même
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {shownVerified.length > 0 && (
                <div>
                  <p className="text-sm text-carbon/60 leading-snug mb-2">
                    <span className="font-semibold text-carbon">
                      {verified.length} modèle{verified.length > 1 ? "s" : ""} compatible
                      {verified.length > 1 ? "s" : ""}
                    </span>{" "}
                    — {verifiedNote}
                  </p>
                  <div className="divide-y divide-carbon/10 border-y border-carbon/10">
                    {shownVerified.map((group) => {
                      const opened = isOpen(group.brand, group.items.length);
                      return (
                        <div key={group.brand}>
                          <button
                            type="button"
                            onClick={() => setOpen(opened && !q ? null : group.brand)}
                            aria-expanded={opened}
                            className="w-full min-h-[44px] flex items-center gap-2 px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon rounded"
                          >
                            <span
                              aria-hidden
                              className={`w-2 h-2 border-r-2 border-b-2 flex-shrink-0 transition-transform ${
                                opened ? "rotate-45 border-green-700" : "-rotate-45 border-carbon/40"
                              }`}
                            />
                            <span className="flex-1 text-sm font-semibold text-carbon">
                              {group.brand}
                            </span>
                            <span className="text-sm text-carbon/50 tabular-nums">
                              {group.items.length}
                            </span>
                          </button>
                          {opened && (
                            <div className="flex flex-wrap gap-1.5 pb-3 pl-4 pt-1">
                              {group.items.map((s) => (
                                <span
                                  key={s.id}
                                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-green-700/10 border border-green-700/20 text-sm text-carbon"
                                >
                                  {scooterLabelShort(s.brand?.name, s.name)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {shownUnverified.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                      À vérifier · {unverified.length} modèle{unverified.length > 1 ? "s" : ""}
                    </h3>
                  </div>
                  <p className="text-sm text-amber-900/80 leading-snug bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-2.5 mb-3">
                    {unverifiedNote}
                  </p>
                  <div className="space-y-3">
                    {shownUnverified.map((group) => (
                      <div key={group.brand}>
                        <p className="text-xs font-bold uppercase tracking-widest text-carbon/70 mb-1.5">
                          {group.brand}
                          <span className="ml-2 text-amber-700">{group.items.length}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.items.map((s) => (
                            <span
                              key={s.id}
                              className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/60 text-sm text-carbon"
                            >
                              {scooterLabelShort(s.brand?.name, s.name)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link to={askUrl(partSlug, partName)} className={CTA_CLASS}>
                      <span aria-hidden className={CTA_SHINE} />
                      <span className="relative">Fais vérifier la mienne</span>
                      <ArrowRight className="relative w-4 h-4" />
                    </Link>
                    <p className="text-sm text-carbon/50 text-center mt-2">
                      Réponse sous 2 h en journée.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-6">
              <Search className="w-9 h-9 text-green-700/50 mb-3" />
              <p className="font-display text-xl uppercase tracking-wide text-carbon">
                On te la trouve
              </p>
              <p className="text-sm text-carbon/60 mt-1.5 max-w-[260px] leading-snug">
                Pas encore référencée sur ton modèle. Dis-nous lequel, on vérifie et on
                te répond sous 2 h.
              </p>
              {partId ? (
                <CompatLeadForm partId={partId} partName={partName} />
              ) : (
                <Link
                  to={askUrl(
                    partSlug,
                    partName,
                    selectedScooter
                      ? `${selectedScooter.brandName} ${selectedScooter.name}`
                      : undefined,
                  )}
                  className={`${CTA_CLASS} mt-5`}
                >
                  <span aria-hidden className={CTA_SHINE} />
                  <span className="relative">Demander une vérification</span>
                  <ArrowRight className="relative w-4 h-4" />
                </Link>
              )}
              <p className="text-sm text-carbon/50 mt-2">
                On te répond même si la pièce ne va pas.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  },
);

export default CompatibilityMatrix;
