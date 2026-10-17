/**
 * Bloc compatibilité COMPACT de la fiche produit (17/10/2026).
 * Défaut corrigé : la liste complète (une ligne par marque, modèles dépliés) faisait 4 écrans
 * de défilement sur téléphone et écrasait la présentation. Ici le bloc tient en un écran ;
 * la liste complète ne s'ouvre que sur demande.
 *
 * 5 formes à comparer via &compat=1..5 :
 * 1 PASTILLES   · marques en pastilles, un toucher déplie ses modèles juste dessous
 * 2 TIROIR      · une seule ligne « Va sur 79 trottinettes », la liste s'ouvre dans un panneau plein écran
 * 3 CARROUSEL   · une carte par marque qui défile à l'horizontale, 3 modèles visibles par carte
 * 4 RECHERCHE   · « Ta trottinette ? » en grand + verdict, marques en une ligne de texte
 * 5 SÉLECTEUR   · deux menus « marque » puis « modèle » → verdict vert ou gris
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, CheckCircle2, HelpCircle, X, ChevronRight, ChevronDown } from "lucide-react";
import type { CompatibleScooter } from "@/hooks/usePartDetail";
import { useSelectedScooter } from "@/contexts/ScooterContext";

export type CompatLook = 1 | 2 | 3 | 4 | 5;

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#ECE7DD";

interface Props {
  look: CompatLook;
  scooters: CompatibleScooter[];
  partSlug: string;
  partName: string;
}

type Group = { brand: string; items: CompatibleScooter[] };
const group = (list: CompatibleScooter[]): Group[] => {
  const m = new Map<string, CompatibleScooter[]>();
  for (const s of list) {
    const b = s.brand?.name?.trim() || "Autres";
    m.set(b, [...(m.get(b) ?? []), s]);
  }
  return [...m.entries()]
    .map(([brand, items]) => ({ brand, items: items.sort((a, b) => a.name.localeCompare(b.name, "fr")) }))
    .sort((a, b) => b.items.length - a.items.length || a.brand.localeCompare(b.brand, "fr"));
};
/** « Kaabo Mantis 10 Plus » sous la marque Kaabo → « Mantis 10 Plus ». */
const short = (s: CompatibleScooter) => {
  const b = s.brand?.name ?? "";
  return b && s.name.toLowerCase().startsWith(b.toLowerCase() + " ") ? s.name.slice(b.length + 1) : s.name;
};
const askUrl = (partSlug: string, partName: string, model?: string) => {
  const p = new URLSearchParams({ piece: partSlug, nom: partName });
  if (model) p.set("modele", model);
  return `/contact?${p.toString()}`;
};

const ModelChip = ({ s, tone = "ok" }: { s: CompatibleScooter; tone?: "ok" | "check" }) => (
  <Link to={`/scooter/${s.slug}`} className="inline-flex items-center min-h-[40px] px-3 rounded-full text-sm font-semibold border"
    style={{ fontFamily: FONT, color: CARBON, backgroundColor: tone === "ok" ? "rgba(74,124,89,0.10)" : "#FFF8EB", borderColor: tone === "ok" ? "rgba(74,124,89,0.25)" : "#F5D9A8" }}>
    {short(s)}
  </Link>
);

const Count = ({ n, toCheck }: { n: number; toCheck: number }) => (
  <div className="flex items-baseline gap-2 flex-wrap">
    <span className="text-4xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: GREEN, letterSpacing: "-0.03em" }}>{n}</span>
    <span className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: FONT, color: CARBON }}>trottinette{n > 1 ? "s" : ""} compatible{n > 1 ? "s" : ""}</span>
    {toCheck > 0 && <span className="text-sm text-gray-500" style={{ fontFamily: FONT }}>+ {toCheck} à vérifier</span>}
  </div>
);

const Mine = ({ scooters }: { scooters: CompatibleScooter[] }) => {
  const { selectedScooter } = useSelectedScooter();
  if (!selectedScooter) return null;
  const hit = scooters.find((s) => s.id === selectedScooter.id);
  const ok = hit?.status === "verified";
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl px-3 min-h-[48px] text-sm font-bold" style={{ fontFamily: FONT, backgroundColor: ok ? "rgba(74,124,89,0.12)" : "#F3F4F6", color: ok ? GREEN : CARBON }}>
      {ok ? <CheckCircle2 className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
      {ok ? `Va sur ta ${selectedScooter.brandName} ${selectedScooter.name}` : hit ? `À vérifier pour ta ${selectedScooter.name}` : `Pas relié à ta ${selectedScooter.name} — on vérifie pour toi`}
    </div>
  );
};

const SearchBox = ({ q, setQ, big = false }: { q: string; setQ: (v: string) => void; big?: boolean }) => (
  <label className="relative block">
    <Search className={`${big ? "w-5 h-5 left-4" : "w-4 h-4 left-3"} absolute top-1/2 -translate-y-1/2 text-gray-400`} />
    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ta trottinette ? ex. Xiaomi 4 Pro" aria-label="Chercher ta trottinette"
      className={`w-full rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-600 ${big ? "min-h-[56px] pl-12 text-lg" : "min-h-[48px] pl-10 text-base"}`}
      style={{ fontFamily: FONT }} />
  </label>
);

const Results = ({ q, scooters, partSlug, partName }: { q: string; scooters: CompatibleScooter[]; partSlug: string; partName: string }) => {
  const nq = q.trim().toLowerCase();
  if (nq.length < 2) return null;
  const hits = scooters.filter((s) => `${s.brand?.name ?? ""} ${s.name}`.toLowerCase().includes(nq)).slice(0, 6);
  return (
    <div className="mt-2 space-y-1.5">
      {hits.map((s) => (
        <Link key={s.id} to={`/scooter/${s.slug}`} className="flex items-center gap-2 min-h-[48px] px-3 rounded-xl border bg-white text-sm font-semibold" style={{ borderColor: LINE, color: CARBON, fontFamily: FONT }}>
          {s.status === "verified" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: GREEN }} /> : <HelpCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />}
          <span className="flex-1">{s.brand?.name} {short(s)}</span>
          <span className="text-sm font-bold" style={{ color: s.status === "verified" ? GREEN : "#B45309" }}>{s.status === "verified" ? "Compatible" : "À vérifier"}</span>
        </Link>
      ))}
      {hits.length === 0 && (
        <p className="text-sm text-gray-600 px-1" style={{ fontFamily: FONT }}>
          Pas dans notre liste. <Link to={askUrl(partSlug, partName, q.trim())} className="font-bold underline inline-flex items-center min-h-[44px]" style={{ color: CARBON }}>On vérifie pour toi</Link>
        </p>
      )}
    </div>
  );
};

const AskLine = ({ partSlug, partName }: { partSlug: string; partName: string }) => (
  <p className="mt-3 text-sm text-gray-600" style={{ fontFamily: FONT }}>
    Ta trottinette n'y est pas ? <Link to={askUrl(partSlug, partName)} className="font-bold underline inline-flex items-center min-h-[44px]" style={{ color: CARBON }}>On vérifie pour toi</Link>
  </p>
);

/** Liste complète (marques → modèles), utilisée dans le tiroir et en « tout voir ». */
const FullList = ({ groups, toCheck }: { groups: Group[]; toCheck: Group[] }) => (
  <div className="space-y-4">
    {groups.map((g) => (
      <div key={g.brand}>
        <div className="text-sm font-bold uppercase tracking-wider mb-1.5" style={{ fontFamily: FONT, color: CARBON }}>{g.brand} <span className="text-gray-400">{g.items.length}</span></div>
        <div className="flex flex-wrap gap-1.5">{g.items.map((s) => <ModelChip key={s.id} s={s} />)}</div>
      </div>
    ))}
    {toCheck.length > 0 && (
      <div className="pt-3 border-t" style={{ borderColor: LINE }}>
        <div className="text-sm font-bold uppercase tracking-wider text-amber-700 mb-1" style={{ fontFamily: FONT }}>À vérifier</div>
        <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: FONT }}>Même jante, largeur non vérifiée : regarde la taille écrite sur ton pneu.</p>
        <div className="flex flex-wrap gap-1.5">{toCheck.flatMap((g) => g.items).map((s) => <ModelChip key={s.id} s={s} tone="check" />)}</div>
      </div>
    )}
  </div>
);

const CompatCompact = ({ look, scooters, partSlug, partName }: Props) => {
  const ok = useMemo(() => scooters.filter((s) => s.status === "verified"), [scooters]);
  const groups = useMemo(() => group(ok), [ok]);
  const toCheck = useMemo(() => group(scooters.filter((s) => s.status !== "verified")), [scooters]);
  const nCheck = scooters.length - ok.length;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);

  if (scooters.length === 0) {
    return (
      <div>
        <p className="text-base text-gray-700" style={{ fontFamily: FONT }}>On n'a pas encore relié cette pièce à un modèle.</p>
        <AskLine partSlug={partSlug} partName={partName} />
      </div>
    );
  }

  // ── 1 · PASTILLES ──
  if (look === 1) {
    const shown = all ? groups : groups.slice(0, 8);
    const cur = groups.find((g) => g.brand === open);
    return (
      <div>
        <Count n={ok.length} toCheck={nCheck} />
        <Mine scooters={scooters} />
        <div className="mt-3"><SearchBox q={q} setQ={setQ} /></div>
        <Results q={q} scooters={scooters} partSlug={partSlug} partName={partName} />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {shown.map((g) => {
            const on = g.brand === open;
            return (
              <button key={g.brand} type="button" onClick={() => setOpen(on ? null : g.brand)} aria-expanded={on}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full border text-sm font-bold transition-colors"
                style={{ fontFamily: FONT, backgroundColor: on ? CARBON : "#fff", color: on ? "#fff" : CARBON, borderColor: on ? CARBON : LINE }}>
                {g.brand}<span style={{ fontFamily: UNB, fontStyle: "italic", color: on ? "#9FD3AE" : GREEN }}>{g.items.length}</span>
              </button>
            );
          })}
          {groups.length > 8 && (
            <button type="button" onClick={() => setAll(!all)} className="inline-flex items-center min-h-[44px] px-3.5 rounded-full text-sm font-bold underline" style={{ fontFamily: FONT, color: CARBON }}>
              {all ? "Moins" : `+ ${groups.length - 8} marques`}
            </button>
          )}
        </div>
        {cur && <div className="mt-3 flex flex-wrap gap-1.5 rounded-xl p-3" style={{ backgroundColor: "#F3F0E9" }}>{cur.items.map((s) => <ModelChip key={s.id} s={s} />)}</div>}
        <AskLine partSlug={partSlug} partName={partName} />
      </div>
    );
  }

  // ── 2 · TIROIR ──
  if (look === 2) {
    return (
      <div>
        <button type="button" onClick={() => setAll(true)} className="w-full flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left" style={{ borderColor: LINE }}>
          <span className="text-3xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: GREEN }}>{ok.length}</span>
          <span className="flex-1">
            <span className="block text-sm font-bold uppercase tracking-wider" style={{ fontFamily: FONT, color: CARBON }}>Trottinettes compatibles</span>
            <span className="block text-sm text-gray-500 truncate" style={{ fontFamily: FONT }}>{groups.slice(0, 4).map((g) => g.brand).join(", ")}{groups.length > 4 ? ` +${groups.length - 4}` : ""}</span>
          </span>
          <ChevronRight className="w-5 h-5" />
        </button>
        <Mine scooters={scooters} />
        {all && (
          <div className="fixed inset-0 z-[60] bg-[#FAFAF8] flex flex-col" role="dialog" aria-modal="true" aria-label="Trottinettes compatibles">
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: LINE }}>
              <span className="flex-1 text-lg uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{ok.length} compatibles</span>
              <button type="button" onClick={() => setAll(false)} aria-label="Fermer" className="w-11 h-11 rounded-full bg-white border flex items-center justify-center" style={{ borderColor: LINE }}><X className="w-5 h-5" /></button>
            </div>
            <div className="px-4 pt-3"><SearchBox q={q} setQ={setQ} /><Results q={q} scooters={scooters} partSlug={partSlug} partName={partName} /></div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-28"><FullList groups={groups} toCheck={toCheck} /></div>
          </div>
        )}
        <AskLine partSlug={partSlug} partName={partName} />
      </div>
    );
  }

  // ── 3 · CARROUSEL ──
  if (look === 3) {
    return (
      <div>
        <Count n={ok.length} toCheck={nCheck} />
        <Mine scooters={scooters} />
        <div className="mt-3"><SearchBox q={q} setQ={setQ} /></div>
        <Results q={q} scooters={scooters} partSlug={partSlug} partName={partName} />
        <div className="mt-3 -mx-4 px-4 flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-2" style={{ scrollbarWidth: "none" }}>
          {groups.map((g) => (
            <div key={g.brand} className="snap-start flex-shrink-0 w-[62%] sm:w-[220px] rounded-2xl bg-white border p-3 relative overflow-hidden" style={{ borderColor: LINE }}>
              <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: GREEN }} />
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold" style={{ fontFamily: FONT, color: CARBON }}>{g.brand}</span>
                <span className="text-xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: GREEN }}>{g.items.length}</span>
              </div>
              <ul className="mt-1.5 space-y-0.5">
                {g.items.slice(0, 3).map((s) => <li key={s.id}><Link to={`/scooter/${s.slug}`} className="text-sm text-gray-700 hover:underline inline-flex min-h-[32px] items-center" style={{ fontFamily: FONT }}>{short(s)}</Link></li>)}
                {g.items.length > 3 && <li className="text-sm text-gray-400" style={{ fontFamily: FONT }}>+ {g.items.length - 3} autres</li>}
              </ul>
            </div>
          ))}
        </div>
        <AskLine partSlug={partSlug} partName={partName} />
      </div>
    );
  }

  // ── 4 · RECHERCHE ──
  if (look === 4) {
    return (
      <div>
        <SearchBox q={q} setQ={setQ} big />
        <Results q={q} scooters={scooters} partSlug={partSlug} partName={partName} />
        <Mine scooters={scooters} />
        <p className="mt-3 text-base text-gray-700 leading-relaxed" style={{ fontFamily: FONT }}>
          Va sur <strong style={{ color: GREEN }}>{ok.length} trottinettes</strong> : {groups.slice(0, 6).map((g) => `${g.brand} (${g.items.length})`).join(", ")}{groups.length > 6 ? "…" : "."}
        </p>
        <button type="button" onClick={() => setAll(!all)} className="mt-1 inline-flex items-center gap-1 min-h-[44px] text-sm font-bold underline" style={{ fontFamily: FONT, color: CARBON }}>
          {all ? "Replier la liste" : `Voir les ${ok.length} modèles`} <ChevronDown className={`w-4 h-4 transition-transform ${all ? "rotate-180" : ""}`} />
        </button>
        {all && <div className="mt-2"><FullList groups={groups} toCheck={toCheck} /></div>}
      </div>
    );
  }

  // ── 5 · SÉLECTEUR ──
  const brands = [...new Set(scooters.map((s) => s.brand?.name ?? "Autres"))].sort((a, b) => a.localeCompare(b, "fr"));
  const models = scooters.filter((s) => (s.brand?.name ?? "Autres") === open).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const pick = models.find((s) => s.id === q) ?? null;
  const sel = "w-full min-h-[52px] rounded-xl border border-gray-300 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-green-600";
  return (
    <div>
      <Count n={ok.length} toCheck={nCheck} />
      <Mine scooters={scooters} />
      <div className="mt-3 grid sm:grid-cols-2 gap-2">
        <select aria-label="Marque" className={sel} style={{ fontFamily: FONT }} value={open ?? ""} onChange={(e) => { setOpen(e.target.value || null); setQ(""); }}>
          <option value="">1 · Ta marque</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select aria-label="Modèle" className={sel} style={{ fontFamily: FONT }} disabled={!open} value={q} onChange={(e) => setQ(e.target.value)}>
          <option value="">2 · Ton modèle</option>
          {models.map((s) => <option key={s.id} value={s.id}>{short(s)}</option>)}
        </select>
      </div>
      {pick && (
        <Link to={`/scooter/${pick.slug}`} className="mt-2 flex items-center gap-2 rounded-xl px-3 min-h-[52px] text-base font-bold" style={{ fontFamily: FONT, backgroundColor: pick.status === "verified" ? "rgba(74,124,89,0.12)" : "#FFF8EB", color: pick.status === "verified" ? GREEN : "#B45309" }}>
          {pick.status === "verified" ? <CheckCircle2 className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
          {pick.status === "verified" ? `Compatible avec ta ${pick.brand?.name} ${short(pick)}` : `À vérifier sur ta ${short(pick)} : regarde la taille sur ton pneu`}
        </Link>
      )}
      <AskLine partSlug={partSlug} partName={partName} />
    </div>
  );
};

export default CompatCompact;
