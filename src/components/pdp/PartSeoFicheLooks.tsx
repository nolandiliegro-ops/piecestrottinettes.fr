/**
 * Fiche « Tout savoir » — 5 propositions de mise en page (20/10/2026), UNIQUEMENT avec ?seo=1&fiche=1..5.
 * Retour Nolan : « beaucoup trop d'infos à la verticale », « il manque de fun, de cohérence et de but à vendre »,
 * la vidéo doit arriver plus vite. Défaut commun corrigé dans les 5 : la compat ne s'empile plus en mur de marques
 * (une ligne par marque) — elle devient une FRISE horizontale de plaques ; le texte avant la première action est réduit.
 * Le contenu SEO reste entier dans le DOM : panneaux masqués par classe, <details> natifs, modèles de toutes les marques.
 *  1 Repassé · 2 Tableau de bord · 3 Parcours · 4 Tout replié · 5 Carte d'identité
 */
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, CheckCircle2, HelpCircle, Search, Wrench, Clock, Package, Sparkles, Gauge, Lightbulb, FileText } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import CompatibilityMatrix from "@/components/pdp/CompatibilityMatrix";
import { SOLID_CATEGORY } from "@/lib/compatibilityStatus";
import { formatPrice } from "@/lib/formatPrice";
import type { PartDetail, CompatibleScooter } from "@/hooks/usePartDetail";
import {
  useFiche, FaqJsonLd, UNB, FONT, CARBON, GREEN, LINE, CHAMFER, Video, Chip, askUrl, fullName, siblingTitle, matchBasis,
  type Fiche, type Group,
} from "@/components/pdp/PartSeoFiche";

export type FicheLook = 1 | 2 | 3 | 4 | 5;
export const FICHE_LOOK_NAMES: Record<FicheLook, string> = { 1: "Repassé", 2: "Tableau de bord", 3: "Parcours", 4: "Replié, compat en bas", 5: "Carte d'identité" };

type P = { part: PartDetail; scooters: CompatibleScooter[]; scootersLoading: boolean; f: Fiche };

const AMBER = "#B45309";
const h3 = "text-sm font-extrabold uppercase tracking-[0.14em]";
const txt = "text-base text-[#374151] leading-relaxed";
const frame = (inset = 0) => ({ clipPath: CHAMFER, boxShadow: `${inset ? `inset ${inset}px 0 0 ${GREEN}, ` : ""}inset 0 0 0 1px ${LINE}` });
const big = { fontFamily: UNB, fontWeight: 900, fontStyle: "italic" as const, letterSpacing: "-0.02em" };

/** « Valve coudée 135°×45° : la tête… » → ["Valve coudée 135°×45°", "la tête…"] */
const splitTrait = (t: string): [string, string] => {
  const i = t.indexOf(" : ");
  const up = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  return i > 0 && i < 48 ? [t.slice(0, i), up(t.slice(i + 3))] : ["", t];
};

// ─── Briques communes ───────────────────────────────────────────────────────

/** Frise horizontale de plaques de marques. Les modèles de TOUTES les marques sont dans le DOM (classe hidden). */
const BrandRail = ({ groups, check = false, dark = false, closed = false }: { groups: Group[]; check?: boolean; dark?: boolean; closed?: boolean }) => {
  const [picked, setSel] = useState("");
  if (!groups.length) return null;
  // Les données arrivent après le premier rendu : la marque ouverte par défaut se lit à chaque rendu, pas à l'init.
  // closed : aucune marque ouverte tant qu'on n'a pas touché une plaque (les modèles restent dans le DOM).
  const sel = groups.some((g) => g.brand === picked) ? picked : closed ? "" : groups[0].brand;
  const accent = check ? AMBER : GREEN;
  return (
    <div>
      <div className="-mx-4 px-4 lg:mx-0 lg:px-0 flex gap-2 overflow-x-auto pb-2 snap-x scroll-pl-4 lg:scroll-pl-0 [scrollbar-width:none]" role="tablist" aria-label="Marques compatibles">
        {groups.map((g) => {
          const on = g.brand === sel;
          return (
            <button key={g.brand} type="button" role="tab" aria-selected={on} onClick={() => setSel(closed && g.brand === sel ? "-" : g.brand)}
              className="snap-start shrink-0 min-h-[56px] min-w-[104px] px-3 py-2 text-left transition-colors"
              style={{ clipPath: CHAMFER, background: on ? (dark ? "#fff" : CARBON) : dark ? "rgba(255,255,255,0.08)" : "#fff",
                color: on ? (dark ? CARBON : "#fff") : dark ? "#fff" : CARBON, boxShadow: on ? "none" : `inset 0 0 0 1px ${dark ? "rgba(255,255,255,0.18)" : LINE}` }}>
              <span className="block text-sm font-extrabold uppercase tracking-wider leading-tight whitespace-nowrap">{g.brand}</span>
              <span className="block text-sm" style={{ ...big, color: on ? (dark ? accent : "#9FD3AE") : accent }}>{g.items.length} modèle{g.items.length > 1 ? "s" : ""}</span>
            </button>
          );
        })}
      </div>
      {groups.map((g) => (
        <div key={g.brand} role="tabpanel" className={`mt-2 flex flex-wrap gap-1.5 ${g.brand === sel ? "" : "hidden"}`}>
          <h4 className="sr-only">Trottinettes {g.brand} compatibles</h4>
          {g.items.map((s) => <Chip key={s.id} s={s} check={check} />)}
        </div>
      ))}
    </div>
  );
};

const SearchBox = ({ part, f, dark = false }: { part: PartDetail; f: Fiche; dark?: boolean }) => (
  <div className="max-w-md">
    <label className="relative block">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      <input value={f.q} onChange={(e) => f.setQ(e.target.value)} placeholder="Ta trottinette ? ex. Xiaomi 4 Pro" aria-label="Chercher ta trottinette"
        className="w-full min-h-[48px] pl-9 pr-3 rounded-lg border bg-white text-base focus:outline-none focus:ring-2 focus:ring-green-600" style={{ borderColor: "#D1D5DB" }} />
    </label>
    {f.nq.length >= 2 && (
      <div className="mt-2 space-y-1.5">
        {f.hits.length > 0 ? f.hits.map((s) => (
          <Link key={s.id} to={`/scooter/${s.slug}`} className="flex items-center gap-2 min-h-[48px] px-3 bg-white text-base font-semibold"
            style={{ color: s.status === "verified" ? GREEN : AMBER, ...frame() }}>
            {s.status === "verified" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <HelpCircle className="w-4 h-4 shrink-0" />}
            {fullName(s)} — {s.status === "verified" ? "compatible" : "à vérifier"}
          </Link>
        )) : (
          <p className={dark ? "text-base text-white/80" : txt}>Pas dans notre liste. <Link to={askUrl(part, f.q.trim())} className="font-bold underline inline-flex items-center min-h-[44px]">On vérifie pour toi</Link>.</p>
        )}
      </div>
    )}
  </div>
);

const CompatBlock = ({ part, f, dark = false, closed = false }: { part: PartDetail; f: Fiche; dark?: boolean; closed?: boolean }) => (
  <div>
    <h3 className="sr-only">Trottinettes compatibles avec {part.name}</h3>
    {f.verified.length + f.toCheck.length > 0 && <div className="mb-3"><SearchBox part={part} f={f} dark={dark} /></div>}
    <BrandRail groups={f.groups} dark={dark} closed={closed} />
    {f.checkGroups.length > 0 && (
      <details className="mt-4 group">
        <summary className="list-none cursor-pointer inline-flex items-center gap-2 min-h-[44px] text-sm font-extrabold uppercase tracking-wider [&::-webkit-details-marker]:hidden" style={{ color: dark ? "#FCD34D" : AMBER }}>
          <HelpCircle className="w-4 h-4" /> À vérifier ({f.toCheck.length}) <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </summary>
        <p className={`${dark ? "text-base text-white/80" : txt} mb-2`}>Ces modèles partagent une cote proche : demande-nous avant de commander.</p>
        <BrandRail groups={f.checkGroups} check dark={dark} closed={closed} />
      </details>
    )}
    <p className={`mt-2 ${dark ? "text-base text-white/80" : txt}`}>
      Ta trottinette n'y est pas ? <Link to={askUrl(part)} className="font-bold underline inline-flex items-center min-h-[44px]" style={{ color: dark ? "#fff" : CARBON }}>On vérifie pour toi</Link>.
    </p>
  </div>
);

const Traits = ({ f, cols = "sm:grid-cols-2" }: { f: Fiche; cols?: string }) => f.points.length ? (
  <ul className={`grid ${cols} gap-2`}>
    {f.points.map((x) => {
      const [lead, rest] = splitTrait(x);
      return (
        <li key={x} className="bg-white p-3.5" style={frame(4)}>
          {lead && <div className="text-sm font-extrabold uppercase tracking-wider mb-1" style={{ color: GREEN }}>{lead}</div>}
          <p className="text-base text-[#374151] leading-snug">{rest}</p>
        </li>
      );
    })}
  </ul>
) : null;

const Specs = ({ f, dark = false, limit }: { f: Fiche; dark?: boolean; limit?: number }) => (
  <dl className={`grid ${dark ? "" : "sm:grid-cols-2"} gap-x-10`}>
    {(limit ? f.specs.slice(0, limit) : f.specs).map(([k, v]) => (
      <div key={k} className="flex items-baseline justify-between gap-4 py-2.5 border-b" style={{ borderColor: dark ? "rgba(255,255,255,0.14)" : LINE }}>
        <dt className={`text-sm uppercase tracking-wider shrink-0 ${dark ? "text-white/60" : "text-gray-500"}`}>{k}</dt>
        <dd className="text-base text-right" style={{ fontWeight: 700, color: dark ? "#fff" : CARBON }}>{v}</dd>
      </div>
    ))}
  </dl>
);

const TechFull = ({ f, noDesc = false }: { f: Fiche; noDesc?: boolean }) => (
  <div>
    <Specs f={f} />
    {f.free.length > 0 && <ul className="mt-3 space-y-1.5">{f.free.map((x) => <li key={x} className={txt}>{x}</li>)}</ul>}
    {!noDesc && f.descText.length > 60 && (
      <details className="mt-3 group">
        <summary className="list-none cursor-pointer inline-flex items-center gap-2 min-h-[44px] text-sm font-extrabold uppercase tracking-wider [&::-webkit-details-marker]:hidden" style={{ color: GREEN }}>
          Description du fabricant <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className={`mt-1 quill-content ${txt}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(f.desc) }} />
      </details>
    )}
  </div>
);

const Steps = ({ items, color = GREEN }: { items: string[]; color?: string }) => (
  <ol className="space-y-3">
    {items.map((s, i) => (
      <li key={i} className="flex gap-3">
        <span className="shrink-0 w-8 h-8 flex items-center justify-center text-sm text-white" style={{ background: color, clipPath: CHAMFER, fontFamily: UNB, fontWeight: 900 }}>{i + 1}</span>
        <span className={txt}>{s}</span>
      </li>
    ))}
  </ol>
);

const Choose = ({ f }: { f: Fiche }) => !f.guide ? null : (
  <div>
    <p className={`${txt} max-w-3xl mb-4`}>{f.guide.choose.intro}</p>
    <Steps items={f.guide.choose.steps} />
    {f.guide.pressure && <p className={`${txt} mt-4 bg-white p-4`} style={frame(4)}>{f.guide.pressure}</p>}
    {f.guide.choose.pitfalls.length > 0 && (
      <div className="mt-4">
        <h3 className={`${h3} mb-2`} style={{ color: CARBON }}>Les erreurs à éviter</h3>
        <ul className="space-y-2">{f.guide.choose.pitfalls.map((x) => (
          <li key={x} className={`flex gap-3 ${txt}`}><span aria-hidden className="mt-2.5 w-2 h-2 shrink-0" style={{ background: "#DC2626" }} /><span>{x}</span></li>
        ))}</ul>
      </div>
    )}
  </div>
);

const installMeta = (part: PartDetail, f: Fiche) => {
  const g = f.guide?.install;
  const tools = part.required_tools?.length ? part.required_tools : g?.tools ?? [];
  return [
    { icon: Wrench, label: "Difficulté", value: part.difficulty_level ? `${part.difficulty_level}/5` : g?.level },
    { icon: Clock, label: "Temps", value: part.estimated_install_time_minutes ? `${part.estimated_install_time_minutes} min` : g?.time },
    { icon: Package, label: "Outils", value: tools.length ? tools.join(", ") : undefined },
  ].filter((m) => !!m.value) as { icon: typeof Wrench; label: string; value: string }[];
};

const InstallMeta = ({ part, f, dark = false }: { part: PartDetail; f: Fiche; dark?: boolean }) => (
  <div className={`grid grid-cols-2 gap-2 ${dark ? "" : "sm:grid-cols-3"}`}>
    {installMeta(part, f).map((m) => (
      <div key={m.label} className={`px-3 py-2.5 ${m.label === "Outils" ? (dark ? "col-span-2" : "col-span-2 sm:col-span-1") : ""}`}
        style={{ clipPath: CHAMFER, background: dark ? "rgba(255,255,255,0.08)" : "#fff", boxShadow: `inset 0 0 0 1px ${dark ? "rgba(255,255,255,0.18)" : LINE}` }}>
        <div className={`flex items-center gap-1.5 text-sm uppercase tracking-wider ${dark ? "text-white/60" : "text-gray-500"}`}><m.icon className="w-4 h-4" />{m.label}</div>
        <div className="text-base" style={{ fontWeight: 800, color: dark ? "#fff" : CARBON }}>{m.value}</div>
      </div>
    ))}
  </div>
);

const Install = ({ part, f, video = true }: { part: PartDetail; f: Fiche; video?: boolean }) => (
  <div>
    {video && part.youtube_video_id && <div className="-mt-5 mb-5"><Video id={part.youtube_video_id} name={part.name} /></div>}
    <div className="mb-4"><InstallMeta part={part} f={f} /></div>
    {f.guide && <Steps items={f.guide.install.steps} color={CARBON} />}
    <p className={`${txt} mt-4`}>Pas envie de le faire toi-même ? <Link to="/contact" className="font-bold underline inline-flex items-center min-h-[44px]" style={{ color: CARBON }}>Demande-nous</Link>.</p>
  </div>
);

const Faq = ({ f }: { f: Fiche }) => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {f.faq.map((it, i) => (
        <div key={it.q} className="bg-white" style={frame()}>
          <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full flex items-center gap-3 min-h-[56px] px-4 text-left">
            <h3 className="flex-1 text-base font-bold" style={{ color: CARBON }}>{it.q}</h3>
            <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
          </button>
          <p className={`px-4 pb-4 ${txt} ${open === i ? "" : "hidden"}`}>{it.a}</p>
        </div>
      ))}
    </div>
  );
};

/** Variantes sœurs en frise : la suivante dépasse du bord, le pouce glisse. */
const SiblingRail = ({ part, f }: { part: PartDetail; f: Fiche }) => !f.siblings.length ? null : (
  <div className="mt-8">
    <h3 className={`${h3} mb-3`} style={{ color: CARBON }}>{siblingTitle(part)}</h3>
    <div className="-mx-4 px-4 lg:mx-0 lg:px-0 flex gap-2 overflow-x-auto pb-2 snap-x scroll-pl-4 lg:scroll-pl-0 [scrollbar-width:none]">
      {f.siblings.map((x) => (
        <Link key={x.id} to={`/piece/${x.slug}`} className="snap-start shrink-0 w-[220px] min-h-[96px] p-3.5 bg-white flex flex-col justify-between" style={frame()}>
          <span className="text-sm font-semibold leading-snug line-clamp-3" style={{ color: CARBON }}>{x.name}</span>
          {x.price != null && <span className="mt-2 text-base" style={{ ...big, fontWeight: 800, color: CARBON }}>{formatPrice(x.price)}</span>}
        </Link>
      ))}
    </div>
  </div>
);

const Sources = ({ f }: { f: Fiche }) => !f.guide?.sources.length ? null : (
  <details className="mt-6 text-sm text-gray-500">
    <summary className="cursor-pointer select-none inline-flex items-center min-h-[44px] hover:underline">Sources ({f.guide.sources.length})</summary>
    <ul className="mt-1 space-y-1">
      {f.guide.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">{s.label}</a></li>)}
    </ul>
  </details>
);

type TabDef = { k: string; label: string; body: ReactNode };
const Tabs = ({ part, tabs, first }: { part: PartDetail; tabs: TabDef[]; first?: string }) => {
  const [picked, setTab] = useState(first ?? "");
  // Le guide de famille arrive après le premier rendu : l'onglet par défaut se relit à chaque rendu.
  const tab = tabs.some((t) => t.k === picked) ? picked : tabs[0]?.k;
  return (
    <div>
      <div role="tablist" aria-label={`Tout savoir sur ${part.name}`} className="-mx-4 px-4 lg:mx-0 lg:px-0 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {tabs.map((t) => (
          <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} aria-controls={`pf-${t.k}`} onClick={() => setTab(t.k)}
            className="shrink-0 min-h-[44px] px-4 text-sm font-extrabold uppercase tracking-wider transition-colors"
            style={{ clipPath: CHAMFER, background: tab === t.k ? CARBON : "#fff", color: tab === t.k ? "#fff" : CARBON, boxShadow: tab === t.k ? "none" : `inset 0 0 0 1px ${LINE}` }}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {tabs.map((t) => <div key={t.k} id={`pf-${t.k}`} role="tabpanel" className={tab === t.k ? "" : "hidden"}>{t.body}</div>)}
      </div>
    </div>
  );
};

const Shell = ({ f, children, bg = "#FAFAF8" }: { f: Fiche; children: ReactNode; bg?: string }) => (
  <section id="pdp-compat" className="px-4 py-8 lg:px-8 lg:py-10 scroll-mt-20" style={{ backgroundColor: bg }}>
    <FaqJsonLd faq={f.faq} />
    <div className="mx-auto max-w-6xl" style={{ fontFamily: FONT }}>{children}</div>
  </section>
);

const Title = ({ children = "Tout savoir sur cette pièce", color = CARBON }: { children?: ReactNode; color?: string }) => (
  <h2 className="text-xl lg:text-3xl uppercase leading-tight" style={{ ...big, color }}>{children}</h2>
);

const CountLine = ({ part, f, loading }: { part: PartDetail; f: Fiche; loading: boolean }) => loading ? null : (
  <p className={`${txt} mt-2 max-w-3xl`}>
    <strong style={{ color: CARBON }}>{part.name}</strong>{f.guideLabel ? ` : ${f.guideLabel}` : ""}.{" "}
    {f.n > 0
      ? <>Va sur <strong style={{ color: GREEN }}>{f.n} trottinette{f.n > 1 ? "s" : ""}</strong> vérifiée{f.n > 1 ? "s" : ""} {matchBasis(part)}{f.groups.length > 1 ? `, ${f.groups.length} marques` : ""}.</>
      : <>Pas encore reliée à un modèle : dis-nous ta trottinette, on vérifie pour toi.</>}
  </p>
);

/**
 * Présentation GÉNÉRÉE (20/10, go Nolan « a ») : 3-4 phrases propres à la référence, tirées de ses données
 * (nom, cote / étrier / tension, nombre de trottinettes, modèles phares). Jamais un chiffre inventé : une donnée absente
 * fait sauter sa phrase. Unique par page sans rédaction à la main, et à jour quand la compat évolue.
 */
const presentationText = (part: PartDetail, f: Fiche): string[] => {
  const row = (label: string) => f.rows.find(([k]) => k === label)?.[1];
  const fam = part.category?.slug ?? "";
  const out: string[] = [];
  if (f.n > 0) {
    const more = f.groups.length > f.top.length ? `, parmi ${f.groups.length} marques` : "";
    out.push(`Compatible avec ${f.n} trottinette${f.n > 1 ? "s" : ""} électrique${f.n > 1 ? "s" : ""}, dont ${f.top.join(", ").replace(/, ([^,]*)$/, " et $1")}${more}.`);
  } else out.push(`${part.name} : ${f.guideLabel || "pièce pour trottinette électrique"}.`);
  const sect = part.fitment_specs?.tire_sections?.[0];
  const caliper = row("Étrier de frein");
  const volt = part.electrical_specs?.voltages?.[0];
  const prise = part.electrical_specs?.connector;
  const disc = row("Diamètre du disque");
  if (["chambres-a-air", "pneus", "pneus-pleins"].includes(fam) && sect)
    out.push(`Avant de commander, lis la cote inscrite sur le flanc de ton pneu actuel : elle doit indiquer ${sect}${fam === "chambres-a-air" ? ", et la valve doit avoir le même angle que celle d'origine" : ""}.`);
  else if (fam === "plaquettes" && caliper)
    out.push(`Ce qui compte, c'est la forme de ton étrier : celle-ci est taillée pour un étrier ${caliper}.`);
  else if (fam === "disques" && disc)
    out.push(`Diamètre ${disc}${row("Entraxe de fixation") ? `, entraxe ${row("Entraxe de fixation")}` : ""} : les deux doivent être identiques à ton disque d'origine.`);
  else if (fam === "chargeurs" && volt)
    out.push(`Pour une batterie de ${volt} V nominal${prise ? `, avec une prise ${prise}` : ""} : la tension doit être exactement celle de ta trottinette.`);
  const lead = splitTrait(f.points[0] ?? "")[0];
  if (lead && fam !== "chargeurs") out.push(`Sa particularité : ${lead.charAt(0).toLowerCase()}${lead.slice(1)}.`);
  return out;
};

/** Description vendeuse rédigée (Airtable « Description SEO », 20/10) : elle commence par une accroche <p><strong>. */
const isVendeuse = (html: string | null) => !!html && /^\s*<p>\s*<strong>/i.test(html);

const Presentation = ({ part, f }: { part: PartDetail; f: Fiche }) => isVendeuse(part.description) ? (
  <div className="max-w-3xl">
    <div className={`quill-content ${txt} [&_ul]:my-3 [&_ul]:space-y-2 [&_li]:pl-1 [&_p]:mb-3 [&_strong]:text-[#1A1A1A]`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(part.description as string) }} />
    {f.n > 0 && <p className="mt-2 text-sm font-extrabold uppercase tracking-wider" style={{ color: GREEN }}>{presentationText(part, f)[0]}</p>}
  </div>
) : (
  <div className="max-w-3xl">
    {presentationText(part, f).map((t) => <p key={t} className={`${txt} mb-2`}>{t}</p>)}
    <p className={txt}>Un doute ? <Link to={askUrl(part)} className="font-bold underline inline-flex items-center min-h-[44px]" style={{ color: CARBON }}>Dis-nous ta trottinette, on vérifie pour toi</Link>.</p>
    {f.descText.length > 60 && (
      <details className="mt-1 group">
        <summary className="list-none cursor-pointer inline-flex items-center gap-2 min-h-[44px] text-sm font-extrabold uppercase tracking-wider [&::-webkit-details-marker]:hidden" style={{ color: GREEN }}>
          Description du fabricant <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className={`mt-1 quill-content ${txt}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(f.desc) }} />
      </details>
    )}
  </div>
);

const standardTabs = (part: PartDetail, f: Fiche, opts: { compat?: boolean; montageFirst?: boolean; video?: boolean } = {}): TabDef[] => {
  const compat = opts.compat !== false ? [{ k: "compat", label: `Compatibilité${f.n ? ` (${f.n})` : ""}`, body: <CompatBlock part={part} f={f} /> }] : [];
  const montage = f.guide ? [{ k: "montage", label: "Montage", body: <Install part={part} f={f} video={opts.video !== false} /> }] : [];
  const rest = [
    { k: "tech", label: "Caractéristiques", body: <TechFull f={f} /> },
    ...(f.guide ? [{ k: "choisir", label: "Bien choisir", body: <Choose f={f} /> }] : []),
  ];
  const faq = f.faq.length ? [{ k: "faq", label: `FAQ (${f.faq.length})`, body: <Faq f={f} /> }] : [];
  return opts.montageFirst ? [...compat, ...montage, ...rest, ...faq] : [...compat, ...rest, ...montage, ...faq];
};

const Fold = ({ title, teaser, children, open = false, icon: Icon }: { title: string; teaser?: string; children: ReactNode; open?: boolean; icon?: typeof Wrench }) => (
  <details className="group bg-white" open={open} style={frame()}>
    <summary className="list-none cursor-pointer flex items-center gap-3 min-h-[60px] px-4 select-none [&::-webkit-details-marker]:hidden">
      {Icon && <span aria-hidden className="shrink-0 w-9 h-9 flex items-center justify-center text-white transition-colors group-open:bg-[#4A7C59]" style={{ background: CARBON, clipPath: CHAMFER }}><Icon className="w-4 h-4" /></span>}
      <h3 className="flex-1 text-sm lg:text-base font-extrabold uppercase tracking-wider" style={{ color: CARBON }}>{title}</h3>
      {teaser && <span className="text-sm text-right max-w-[45%] truncate" style={{ ...big, color: GREEN }}>{teaser}</span>}
      <ChevronDown className="w-5 h-5 shrink-0 transition-transform group-open:rotate-180" />
    </summary>
    <div className="px-4 pb-5 pt-1">{children}</div>
  </details>
);


// ─── 1 · REPASSÉ : l'existant à l'identique, compacté ─────────────────────────
const Repasse = ({ part, f, scootersLoading }: P) => (
  <Shell f={f}>
    <div className="border-t-2 pt-6" style={{ borderColor: CARBON }}>
      <Title />
      <CountLine part={part} f={f} loading={scootersLoading} />
      {f.points.length > 0 && <div className="mt-4"><Traits f={f} cols={f.points.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"} /></div>}
      <div className="mt-5"><Tabs part={part} tabs={standardTabs(part, f, { montageFirst: true })} /></div>
      <SiblingRail part={part} f={f} />
      <Sources f={f} />
    </div>
  </Shell>
);

// ─── 2 · TABLEAU DE BORD : cotes en grandes tuiles techniques ─────────────────
const Dashboard = ({ part, f }: P) => {
  const lead = f.rows[0];
  const tiles: { label: string; value: string; accent?: boolean }[] = [
    ...(lead ? [{ label: lead[0], value: lead[1].split(" · ")[0] }] : []),
    { label: "Trottinettes", value: String(f.n), accent: true },
    { label: "Marques", value: String(f.groups.length) },
    ...f.points.slice(0, 1).map((x) => ({ label: "Signe distinctif", value: splitTrait(x)[0] || "—" })),
  ].slice(0, 4);
  return (
    <Shell f={f}>
      <Title />
      <p className={`${txt} mt-1 sr-only`}>{part.name} : {f.guideLabel}.</p>
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="px-4 py-3 min-h-[96px] flex flex-col justify-between" style={{ clipPath: CHAMFER, background: t.accent ? GREEN : CARBON }}>
            <span className="text-sm uppercase tracking-wider text-white/70">{t.label}</span>
            <span className="text-white leading-none break-words" style={{ ...big, fontSize: t.value.length > 12 ? "1.15rem" : "clamp(1.6rem, 6vw, 2.4rem)" }}>{t.value}</span>
          </div>
        ))}
      </div>
      <div className={`mt-5 grid gap-5 ${part.youtube_video_id ? "lg:grid-cols-[1.1fr_1fr]" : ""}`}>
        {part.youtube_video_id && <div className="-mt-5 min-w-0"><Video id={part.youtube_video_id} name={part.name} /></div>}
        <div className="min-w-0">
          <h3 className={`${h3} mb-3`} style={{ color: GREEN }}>Ça va sur ta trottinette ?</h3>
          <CompatBlock part={part} f={f} />
        </div>
      </div>
      {f.points.length > 0 && <div className="mt-6"><Traits f={f} cols="sm:grid-cols-3" /></div>}
      <div className="mt-6"><Tabs part={part} tabs={standardTabs(part, f, { compat: false, video: false })} /></div>
      <SiblingRail part={part} f={f} />
      <Sources f={f} />
    </Shell>
  );
};

// ─── 3 · PARCOURS : Va sur ta trott ? → Pourquoi celle-ci → Comment la monter ──
const Stage = ({ num, title, children }: { num: string; title: string; children: ReactNode }) => (
  <div className="relative pl-12 lg:pl-16 pb-8">
    <span aria-hidden className="absolute left-0 top-0 w-9 h-9 lg:w-12 lg:h-12 flex items-center justify-center text-white text-base lg:text-xl" style={{ ...big, background: CARBON, clipPath: CHAMFER }}>{num}</span>
    <span aria-hidden className="absolute left-[17px] lg:left-[23px] top-11 lg:top-14 bottom-2 w-0.5" style={{ background: LINE }} />
    <h3 className="text-lg lg:text-2xl uppercase leading-tight mb-3" style={{ ...big, color: CARBON }}>{title}</h3>
    {children}
  </div>
);

const Parcours = ({ part, f }: P) => (
  <Shell f={f}>
    <Title />
    <p className="sr-only">{part.name} : {f.guideLabel}.</p>
    <div className="mt-6">
      <Stage num="1" title={f.n ? `Ça va sur ta trott ? ${f.n} modèles vérifiés` : "Ça va sur ta trott ?"}>
        <CompatBlock part={part} f={f} />
      </Stage>
      <Stage num="2" title="Pourquoi celle-ci">
        <Traits f={f} cols="sm:grid-cols-3" />
        <div className="mt-3 max-w-3xl"><Specs f={f} limit={4} /></div>
        <details className="mt-2 group">
          <summary className="list-none cursor-pointer inline-flex items-center gap-2 min-h-[44px] text-sm font-extrabold uppercase tracking-wider [&::-webkit-details-marker]:hidden" style={{ color: CARBON }}>
            Toute la fiche technique <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2"><TechFull f={f} /></div>
        </details>
      </Stage>
      <Stage num="3" title="Comment la monter">
        {part.youtube_video_id && <div className="-mt-5 mb-4 max-w-2xl"><Video id={part.youtube_video_id} name={part.name} /></div>}
        <div className="max-w-2xl"><InstallMeta part={part} f={f} /></div>
        {f.guide && (
          <details className="mt-2 group">
            <summary className="list-none cursor-pointer inline-flex items-center gap-2 min-h-[44px] text-sm font-extrabold uppercase tracking-wider [&::-webkit-details-marker]:hidden" style={{ color: CARBON }}>
              Les {f.guide.install.steps.length} étapes <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2"><Steps items={f.guide.install.steps} color={CARBON} /></div>
          </details>
        )}
      </Stage>
    </div>
    <div className="space-y-2 max-w-4xl">
      {f.guide && <Fold title="Bien choisir" teaser={`${f.guide.choose.steps.length} conseils`}><Choose f={f} /></Fold>}
      {f.faq.length > 0 && <Fold title="Questions fréquentes" teaser={String(f.faq.length)}><Faq f={f} /></Fold>}
    </div>
    <SiblingRail part={part} f={f} />
    <Sources f={f} />
  </Shell>
);

// ─── 4 · TOUT REPLIÉ : la lecture littérale de « compacter » ───────────────────
const Replie = ({ part, f, scooters, scootersLoading }: P) => {
  const goCompat = () => document.getElementById("pf-compat-bas")?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <Shell f={f}>
      <div className="border-t-2 pt-6 max-w-4xl" style={{ borderColor: CARBON }}>
        <Title />
        {/* Un repère, zéro phrase : le chiffre de compat descend au module du bas. */}
        <div className="mt-3 flex flex-wrap gap-2">
          {!scootersLoading && f.n > 0 && (
            <button type="button" onClick={goCompat} className="inline-flex items-center gap-2 min-h-[44px] px-4 text-white" style={{ background: GREEN, clipPath: CHAMFER }}>
              <span className="text-lg leading-none" style={big}>{f.n}</span>
              <span className="text-sm font-extrabold uppercase tracking-wider">trottinettes</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-5 space-y-2">
          <Fold icon={FileText} title="Présentation" open={isVendeuse(part.description)}><Presentation part={part} f={f} /></Fold>
          {f.points.length > 0 && <Fold icon={Sparkles} title="Ce qui la distingue"><Traits f={f} /></Fold>}
          {f.guide && <Fold icon={Wrench} title="Montage" teaser={part.youtube_video_id ? "vidéo" : undefined}><Install part={part} f={f} /></Fold>}
          <Fold icon={Gauge} title="Caractéristiques" teaser={f.rows[0]?.[1].split(" · ")[0]}><TechFull f={f} noDesc /></Fold>
          {f.guide && <Fold icon={Lightbulb} title="Bien choisir"><Choose f={f} /></Fold>}
          {f.faq.length > 0 && <Fold icon={HelpCircle} title="Questions fréquentes" teaser={String(f.faq.length)}><Faq f={f} /></Fold>}
        </div>

        {/* Module compatibilité, en bas (Nolan 20/10) : recherche + frise, aucune marque ouverte d'office. */}
        <div id="pf-compat-bas" className="mt-8 scroll-mt-24 p-4 lg:p-5" style={{ background: "#fff", ...frame(4) }}>
          <div className="mb-3">
            <h3 className="text-lg lg:text-xl uppercase leading-tight" style={{ ...big, color: CARBON }}>Ça va sur ta trott ?</h3>
            {f.n > 0 && <p className="mt-1 text-sm font-extrabold uppercase tracking-wider" style={{ color: GREEN }}>{f.n} modèles · {f.groups.length} marques</p>}
          </div>
          {part.category?.slug === SOLID_CATEGORY
            ? <CompatibilityMatrix scooters={scooters} isLoading={scootersLoading} partSlug={part.slug} partName={part.name} partId={part.id} categorySlug={SOLID_CATEGORY} bare />
            : <CompatBlock part={part} f={f} closed />}
        </div>
      </div>
      <SiblingRail part={part} f={f} />
      <Sources f={f} />
    </Shell>
  );
};

// ─── 5 · CARTE D'IDENTITÉ : la pièce en carte sombre, la vidéo dedans ──────────
const Identite = ({ part, f }: P) => {
  const lead = f.rows[0]?.[1].split(" · ")[0] ?? "";
  return (
    <Shell f={f}>
      <div className="grid lg:grid-cols-[380px_1fr] gap-6 lg:gap-10 items-start">
        <aside className="min-w-0 lg:sticky lg:top-24 p-5 text-white" style={{ background: CARBON, clipPath: "polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)" }}>
          <p className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: "#9FD3AE" }}>Carte d'identité</p>
          {lead && <div className="mt-1 leading-none whitespace-nowrap overflow-hidden" style={{ ...big, fontSize: lead.length > 6 ? "2.2rem" : "3.2rem", color: "transparent", WebkitTextStroke: "1.5px rgba(255,255,255,0.85)" }}>{lead}</div>}
          <h2 className="mt-2 text-base font-bold leading-snug">{part.name}</h2>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl leading-none" style={{ ...big, color: "#9FD3AE" }}>{f.n}</span>
            <span className="text-sm uppercase tracking-wider text-white/70">trottinettes · {f.groups.length} marques</span>
          </div>
          <div className="mt-4"><Specs f={f} dark limit={5} /></div>
          {part.youtube_video_id && <div className="-mt-1"><Video id={part.youtube_video_id} name={part.name} /></div>}
          <div className="mt-4"><InstallMeta part={part} f={f} dark /></div>
        </aside>
        <div className="min-w-0">
          <Title>Ça va sur ta trott ?</Title>
          <div className="mt-3"><CompatBlock part={part} f={f} /></div>
          {f.points.length > 0 && <div className="mt-6"><h3 className={`${h3} mb-3`} style={{ color: GREEN }}>Ce qui la distingue</h3><Traits f={f} /></div>}
          <div className="mt-6"><Tabs part={part} tabs={standardTabs(part, f, { compat: false, video: false })} /></div>
          <SiblingRail part={part} f={f} />
          <Sources f={f} />
        </div>
      </div>
    </Shell>
  );
};

const LOOKS = { 1: Repasse, 2: Dashboard, 3: Parcours, 4: Replie, 5: Identite } as const;

const PartSeoFicheLooks = ({ look, tag = false, ...p }: { look: FicheLook; tag?: boolean; part: PartDetail; scooters: CompatibleScooter[]; scootersLoading: boolean }) => {
  const f = useFiche(p.part, p.scooters);
  const V = LOOKS[look];
  return (
    <>
      {tag && <div className="fixed top-20 right-3 z-40 rounded-full px-3 py-1.5 text-sm font-bold text-white shadow" style={{ backgroundColor: CARBON, fontFamily: FONT }}>
        Fiche {look} · {FICHE_LOOK_NAMES[look]}
      </div>}
      <V {...p} f={f} />
    </>
  );
};

export default PartSeoFicheLooks;
