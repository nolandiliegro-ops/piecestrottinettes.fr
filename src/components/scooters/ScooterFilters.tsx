/**
 * Barre de filtres + tri de la page /trottinettes (16/10/2026).
 * Ordinateur : une pastille par filtre (menu déroulant) + tri à droite.
 * Téléphone : bouton « Filtres (n) » qui ouvre un panneau du bas + tri.
 * Chaque option affiche le nombre de modèles qu'elle donnerait (calculé sur la liste déjà filtrée par les autres groupes).
 */
import { useMemo, useState } from "react";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FILTER_GROUPS, SORTS, type FilterableScooter, type Selection } from "@/lib/scooterFilters";

interface Props {
  /** liste avant filtres (après marque + recherche) */
  base: FilterableScooter[];
  selection: Selection;
  onToggle: (group: string, value: string) => void;
  onClear: () => void;
  sort: string;
  onSort: (v: string) => void;
  resultCount: number;
}

const GREEN = "#4A7C59";

const ScooterFilters = ({ base, selection, onToggle, onClear, sort, onSort, resultCount }: Props) => {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(selection).reduce((n, v) => n + (v?.length ?? 0), 0);

  // Nombre de modèles par option : liste filtrée par TOUS les autres groupes, puis cette option.
  const optionCounts = useMemo(() => {
    const res: Record<string, Record<string, number>> = {};
    FILTER_GROUPS.forEach((g) => {
      const others = FILTER_GROUPS.filter((o) => o.key !== g.key && selection[o.key]?.length);
      const pool = base.filter((s) => others.every((o) => o.options.some((op) => selection[o.key].includes(op.value) && op.test(s))));
      res[g.key] = {};
      g.options.forEach((op) => { res[g.key][op.value] = pool.filter(op.test).length; });
    });
    return res;
  }, [base, selection]);

  const OptionList = ({ groupKey }: { groupKey: string }) => {
    const g = FILTER_GROUPS.find((x) => x.key === groupKey)!;
    return (
      <div className="flex flex-col">
        {g.options.map((op) => {
          const on = selection[g.key]?.includes(op.value);
          const n = optionCounts[g.key]?.[op.value] ?? 0;
          return (
            <button key={op.value} type="button" onClick={() => onToggle(g.key, op.value)} disabled={!on && n === 0}
              className={cn("flex items-center gap-3 min-h-[44px] px-3 rounded-lg text-left text-sm transition-colors disabled:opacity-40",
                on ? "bg-mineral/10" : "hover:bg-gray-100")}>
              <span className={cn("w-5 h-5 rounded-md border flex items-center justify-center shrink-0", on ? "border-transparent" : "border-gray-300 bg-white")}
                style={on ? { background: GREEN } : undefined}>
                {on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </span>
              <span className="flex-1 text-carbon">{op.label}</span>
              <span className="text-gray-500 tabular-nums">{n}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const SortSelect = ({ className }: { className?: string }) => (
    <label className={cn("relative flex items-center", className)}>
      <span className="sr-only">Trier par</span>
      <select value={sort} onChange={(e) => onSort(e.target.value)}
        className="appearance-none h-11 pl-4 pr-10 rounded-full border border-gray-300 bg-white text-sm font-semibold text-carbon outline-none focus:ring-2 focus:ring-green-600 cursor-pointer">
        {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 w-4 h-4 text-gray-500 pointer-events-none" />
    </label>
  );

  const chips = FILTER_GROUPS.flatMap((g) =>
    (selection[g.key] ?? []).map((v) => ({ g: g.key, v, label: g.options.find((o) => o.value === v)?.label ?? v })));

  return (
    <div className="mb-5">
      {/* Ordinateur */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        {FILTER_GROUPS.map((g) => {
          const n = selection[g.key]?.length ?? 0;
          return (
            <Popover key={g.key}>
              <PopoverTrigger asChild>
                <button type="button"
                  className={cn("h-11 px-4 rounded-full border text-sm font-semibold inline-flex items-center gap-2 transition-colors",
                    n ? "text-white border-transparent" : "bg-white border-gray-300 text-carbon hover:border-carbon")}
                  style={n ? { background: GREEN } : undefined}>
                  {g.label}{n ? ` · ${n}` : ""}
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 p-2 rounded-xl">
                <OptionList groupKey={g.key} />
              </PopoverContent>
            </Popover>
          );
        })}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-500">{resultCount} modèle{resultCount > 1 ? "s" : ""}</span>
          <SortSelect />
        </div>
      </div>

      {/* Téléphone */}
      <div className="flex md:hidden items-center gap-2">
        <button type="button" onClick={() => setOpen(true)}
          className={cn("h-11 px-4 rounded-full border text-sm font-semibold inline-flex items-center gap-2",
            activeCount ? "text-white border-transparent" : "bg-white border-gray-300 text-carbon")}
          style={activeCount ? { background: GREEN } : undefined}>
          <SlidersHorizontal className="w-4 h-4" />
          Filtres{activeCount ? ` (${activeCount})` : ""}
        </button>
        <SortSelect className="flex-1 [&>select]:w-full" />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-4 pb-0">
          <SheetHeader className="text-left">
            <SheetTitle className="font-black uppercase">Filtres</SheetTitle>
          </SheetHeader>
          <div className="mt-2 space-y-4 pb-4">
            {FILTER_GROUPS.map((g) => (
              <div key={g.key}>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-1 px-1">{g.label}</p>
                <OptionList groupKey={g.key} />
              </div>
            ))}
          </div>
          <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-white border-t border-gray-100 flex gap-2">
            <button type="button" onClick={onClear} disabled={!activeCount}
              className="h-12 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-carbon disabled:opacity-40">Effacer</button>
            <button type="button" onClick={() => setOpen(false)}
              className="h-12 flex-1 rounded-lg text-white text-sm font-semibold" style={{ background: GREEN }}>
              Voir {resultCount} modèle{resultCount > 1 ? "s" : ""}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Filtres actifs */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {chips.map((c) => (
            <button key={c.g + c.v} type="button" onClick={() => onToggle(c.g, c.v)}
              className="h-9 pl-3 pr-2 rounded-full bg-white border border-gray-300 text-sm text-carbon inline-flex items-center gap-1 hover:border-carbon">
              {c.label}<X className="w-4 h-4 text-gray-500" />
            </button>
          ))}
          <button type="button" onClick={onClear} className="h-9 px-3 text-sm font-semibold underline underline-offset-2" style={{ color: GREEN }}>
            Tout effacer
          </button>
        </div>
      )}
    </div>
  );
};

export default ScooterFilters;
