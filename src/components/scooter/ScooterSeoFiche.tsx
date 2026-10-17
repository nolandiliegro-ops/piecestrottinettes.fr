/**
 * Fiche trottinette complète (pilote SEO du 17/10/2026). Remplace le simple paragraphe « Présentation »
 * quand le modèle a une entrée dans src/data/scooterSeo.ts.
 * 17/10 (soir) : par défaut en ONGLETS « Tout savoir sur… » sous les pièces compatibles — Nolan : la fiche longue
 * repoussait les pièces. Tout le texte reste dans le DOM (onglets inactifs masqués par classe) : Google le lit.
 * ?fiche=long = ancienne version en sections empilées.
 * Sections : présentation (H2 avec le nom du modèle), fiche technique, points forts / limites,
 * pièces d'usure et tailles exactes (liens vers nos fiches pièces), entretien, prix / où l'acheter, FAQ, sources.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, Minus, Play, ShieldCheck } from "lucide-react";
import { partnerOf } from "@/config/partners";
import type { ScooterSeo } from "@/data/scooterSeo";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";

const Block = ({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="px-4 py-9 lg:px-8 scroll-mt-20" style={{ backgroundColor: "#FAFAF8" }}>
    <div className="mx-auto max-w-6xl grid lg:grid-cols-[260px_1fr] gap-3 lg:gap-10 border-t pt-7" style={{ borderColor: LINE }}>
      <h2 className="text-xl lg:text-2xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>{title}</h2>
      <div className="min-w-0">{children}</div>
    </div>
  </section>
);

type Mode = "tabs" | "long";

/** Vidéo légère : vignette + bouton lecture, l'iframe YouTube ne se charge qu'au clic (page rapide). */
const Video = ({ v, name }: { v: NonNullable<ScooterSeo["video"]>; name: string }) => {
  const [play, setPlay] = useState(false);
  return (
    <figure className="w-full">
      <div className="relative w-full aspect-video bg-[#1A1A1A] overflow-hidden" style={{ clipPath: CHAMFER }}>
        {play ? (
          <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
            title={v.title} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 w-full h-full" aria-label={`Lire la vidéo : ${v.title}`}>
            <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt={`Vidéo ${name}`} loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-16 h-16 rounded-full flex items-center justify-center bg-white/95 shadow-xl group-hover:scale-105 transition-transform">
                <Play className="w-7 h-7 ml-1" style={{ color: CARBON }} fill={CARBON} />
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-2 text-sm text-gray-500" style={{ fontFamily: FONT }}>Vidéo : {v.channel}</figcaption>
    </figure>
  );
};

/** « Où l'acheter » : le partenaire présenté comme un choix de l'atelier, lien partenaire assumé. */
export const PartnerBlock = ({ url, name }: { url: string; name: string }) => {
  const p = partnerOf(url);
  if (!p) return null;
  return (
    <div id="ou-acheter" className="mt-8 scroll-mt-24 bg-white p-5 lg:p-6 grid lg:grid-cols-[1fr_auto] gap-4 lg:gap-8 items-center" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
      <div>
        <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>Où acheter la {name}</p>
        <p className="mt-1 text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Notre partenaire : {p.name}</p>
        <p className="mt-2 text-base text-[#374151] leading-relaxed max-w-2xl">
          On vend les pièces, pas les trottinettes. Pour la machine, on te conseille un vendeur que notre atelier connaît.
        </p>
        <p className="mt-2 flex items-start gap-2 text-sm text-gray-500">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Lien partenaire : une petite commission pour nous, aucun surcoût pour toi.</span>
        </p>
      </div>
      <a href={url} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex items-center justify-center gap-2 min-h-[52px] px-6 text-sm font-extrabold uppercase tracking-wider text-white"
        style={{ background: CARBON, clipPath: CHAMFER }}>
        Voir l'offre chez {p.name} <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
};

const Tabs = ({ seo, affiliateLink }: { seo: ScooterSeo; affiliateLink?: string | null }) => {
  const name = seo.displayName;
  const hasPrice = !!seo.price;
  const tabs = [
    { k: "pres", label: "Présentation" },
    { k: "tech", label: "Fiche technique" },
    { k: "tailles", label: "Tailles d'usure" },
    { k: "avis", label: "Forts / limites" },
    { k: "entretien", label: "Entretien" },
    ...(hasPrice ? [{ k: "prix", label: "Prix" }] : []),
    { k: "faq", label: `FAQ (${seo.faq.length})` },
  ];
  const [tab, setTab] = useState("pres");
  const [open, setOpen] = useState<number | null>(0);
  const panel = (k: string) => (tab === k ? "" : "hidden");
  const h3 = "text-sm font-extrabold uppercase tracking-[0.14em] mb-3";
  return (
    <section id="tout-savoir" className="px-4 py-10 lg:px-8 scroll-mt-20" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="mx-auto max-w-6xl border-t pt-8" style={{ borderColor: LINE }}>
        <h2 className="text-2xl lg:text-3xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>
          Tout savoir sur la {name}
        </h2>
        <div role="tablist" aria-label={`Tout savoir sur la ${name}`} className="mt-5 -mx-4 px-4 lg:mx-0 lg:px-0 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {tabs.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} aria-controls={`ts-${t.k}`} onClick={() => setTab(t.k)}
              className="shrink-0 min-h-[44px] px-4 text-sm font-extrabold uppercase tracking-wider transition-colors"
              style={{ fontFamily: FONT, clipPath: CHAMFER, background: tab === t.k ? CARBON : "#fff", color: tab === t.k ? "#fff" : CARBON, boxShadow: tab === t.k ? "none" : `inset 0 0 0 1px ${LINE}` }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 min-h-[220px] max-w-5xl" style={{ fontFamily: FONT }}>
          <div id="ts-pres" role="tabpanel" className={panel("pres")}>
            <div className={seo.video ? "grid lg:grid-cols-[1fr_minmax(0,420px)] gap-6 lg:gap-10 items-start" : ""}>
              <div>
                <h3 className={h3} style={{ color: GREEN }}>{name} : présentation</h3>
                <div className="space-y-4 text-base md:text-lg text-[#374151] leading-relaxed">{seo.intro.map((p, i) => <p key={i}>{p}</p>)}</div>
              </div>
              {seo.video && <Video v={seo.video} name={name} />}
            </div>
          </div>

          <div id="ts-tech" role="tabpanel" className={panel("tech")}>
            <h3 className={h3} style={{ color: GREEN }}>Fiche technique {name}</h3>
            <dl className="grid sm:grid-cols-2 gap-x-10">
              {seo.specs.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 py-3 border-b" style={{ borderColor: LINE }}>
                  <dt className="text-sm uppercase tracking-wider text-gray-500 shrink-0">{k}</dt>
                  <dd className="text-base text-right" style={{ fontWeight: 700, color: CARBON }}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div id="ts-tailles" role="tabpanel" className={panel("tailles")}>
            <h3 className={h3} style={{ color: GREEN }}>Pièces d'usure et tailles exactes</h3>
            <div className="grid gap-2">
              {seo.parts.map((p) => (
                <Link key={p.label + p.size} to={p.to} className="flex items-center gap-4 min-h-[56px] pl-4 pr-3 py-2 bg-white"
                  style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
                  <span className="w-28 shrink-0 text-sm font-extrabold uppercase tracking-wide" style={{ color: CARBON }}>{p.label}</span>
                  <span className="flex-1 min-w-0 text-base text-[#374151]">{p.size}</span>
                  <span className="hidden sm:inline text-sm text-gray-500 shrink-0">{p.count} réf.</span>
                  <ArrowRight className="w-4 h-4 shrink-0" style={{ color: GREEN }} />
                </Link>
              ))}
            </div>
          </div>

          <div id="ts-avis" role="tabpanel" className={panel("avis")}>
            <div className="grid md:grid-cols-2 gap-4">
              {([["Points forts", seo.pros, true], ["Limites", seo.cons, false]] as const).map(([t, list, good]) => (
                <div key={t} className="bg-white p-5" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${good ? GREEN : CARBON}, inset 0 0 0 1px ${LINE}` }}>
                  <h3 className={h3} style={{ color: good ? GREEN : CARBON }}>{t}</h3>
                  <ul className="space-y-2.5">
                    {list.map((x) => (
                      <li key={x} className="flex gap-2.5 text-base text-[#374151] leading-snug">
                        {good ? <Check className="w-4 h-4 mt-1 shrink-0" style={{ color: GREEN }} strokeWidth={3} /> : <Minus className="w-4 h-4 mt-1 shrink-0 text-gray-500" strokeWidth={3} />}
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div id="ts-entretien" role="tabpanel" className={panel("entretien")}>
            <h3 className={h3} style={{ color: GREEN }}>Entretien de la {name}</h3>
            <ul className="space-y-3">
              {seo.care.map((c) => (
                <li key={c} className="flex gap-3 text-base text-[#374151] leading-relaxed">
                  <span aria-hidden className="mt-2.5 w-2 h-2 shrink-0" style={{ background: GREEN }} /><span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {hasPrice && (
            <div id="ts-prix" role="tabpanel" className={`${panel("prix")} space-y-3`}>
              <h3 className={h3} style={{ color: GREEN }}>Prix et où l'acheter</h3>
              {seo.price && <p className="text-base text-[#374151]">{seo.price.text} <span className="text-sm text-gray-500">Source : {seo.price.source}.</span></p>}
            </div>
          )}

          <div id="ts-faq" role="tabpanel" className={`${panel("faq")} space-y-2`}>
            {seo.faq.map((it, i) => (
              <div key={it.q} className="bg-white" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full flex items-center gap-3 min-h-[56px] px-4 text-left">
                  <h3 className="flex-1 text-base font-bold" style={{ color: CARBON }}>{it.q}</h3>
                  <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
                </button>
                <p className={`px-4 pb-4 text-base text-[#374151] leading-relaxed ${open === i ? "" : "hidden"}`}>{it.a}</p>
              </div>
            ))}
          </div>
        </div>

        {affiliateLink && <PartnerBlock url={affiliateLink} name={name} />}

        {/* 18/10 (Nolan) : sources repliées — discrètes à l'écran, toujours dans la page pour Google. */}
        <details className="mt-6 text-sm text-gray-500" style={{ fontFamily: FONT }}>
          <summary className="cursor-pointer select-none inline-flex items-center min-h-[44px] underline-offset-2 hover:underline">Sources ({seo.sources.length})</summary>
          <ul className="mt-1 space-y-1">
            {seo.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">{s.label}</a></li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
};

const Long = ({ seo, affiliateLink }: { seo: ScooterSeo; affiliateLink?: string | null }) => {
  const [open, setOpen] = useState<number | null>(0);
  const name = seo.displayName;
  return (
    <>
      <Block id="presentation" title={`${name} : présentation`}>
        <div className="max-w-3xl space-y-4 text-base md:text-lg text-[#374151] leading-relaxed" style={{ fontFamily: FONT }}>
          {seo.intro.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </Block>

      <Block id="fiche-technique" title="Fiche technique">
        <dl className="grid sm:grid-cols-2 gap-x-10 max-w-4xl">
          {seo.specs.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-3 border-b" style={{ borderColor: LINE }}>
              <dt className="text-sm uppercase tracking-wider text-gray-500 shrink-0" style={{ fontFamily: FONT }}>{k}</dt>
              <dd className="text-base text-right" style={{ fontFamily: FONT, fontWeight: 700, color: CARBON }}>{v}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block id="pieces-usure" title="Pièces d'usure et tailles exactes">
        <p className="max-w-3xl text-base text-[#374151] mb-4" style={{ fontFamily: FONT }}>
          Les cotes à connaître avant de commander pour ta {name}. Chaque pièce listée est vérifiée sur sa cote de montage.
        </p>
        <div className="grid gap-2 max-w-4xl">
          {seo.parts.map((p) => (
            <Link key={p.label + p.size} to={p.to} className="group flex items-center gap-4 min-h-[60px] pl-4 pr-3 py-2 bg-white transition-transform hover:-translate-y-0.5"
              style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
              <span className="w-28 shrink-0 text-sm font-extrabold uppercase tracking-wide" style={{ fontFamily: FONT, color: CARBON }}>{p.label}</span>
              <span className="flex-1 min-w-0 text-base text-[#374151]" style={{ fontFamily: FONT }}>{p.size}</span>
              <span className="hidden sm:inline text-sm text-gray-500 shrink-0" style={{ fontFamily: FONT }}>{p.count} réf.</span>
              <span className="inline-flex items-center gap-1 text-sm font-extrabold uppercase shrink-0" style={{ fontFamily: FONT, color: GREEN }}>
                <span className="hidden md:inline">{p.cta}</span><ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </Block>

      <Block id="avis" title="Points forts et limites">
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
          {([["Points forts", seo.pros, true], ["Limites", seo.cons, false]] as const).map(([t, list, good]) => (
            <div key={t} className="bg-white p-5" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${good ? GREEN : CARBON}, inset 0 0 0 1px ${LINE}` }}>
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] mb-3" style={{ fontFamily: FONT, color: good ? GREEN : CARBON }}>{t}</h3>
              <ul className="space-y-2.5">
                {list.map((x) => (
                  <li key={x} className="flex gap-2.5 text-base text-[#374151] leading-snug" style={{ fontFamily: FONT }}>
                    {good ? <Check className="w-4 h-4 mt-1 shrink-0" style={{ color: GREEN }} strokeWidth={3} /> : <Minus className="w-4 h-4 mt-1 shrink-0 text-gray-500" strokeWidth={3} />}
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Block>

      <Block id="entretien" title="Entretien">
        <ul className="max-w-3xl space-y-3">
          {seo.care.map((c) => (
            <li key={c} className="flex gap-3 text-base text-[#374151] leading-relaxed" style={{ fontFamily: FONT }}>
              <span aria-hidden className="mt-2.5 w-2 h-2 shrink-0" style={{ background: GREEN }} />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Block>

      {(seo.price || affiliateLink) && (
        <Block id="prix" title="Prix et où l'acheter">
          <div className="max-w-3xl space-y-3" style={{ fontFamily: FONT }}>
            {seo.price && <p className="text-base text-[#374151]">{seo.price.text} <span className="text-sm text-gray-500">Source : {seo.price.source}.</span></p>}
            {affiliateLink && (
              <a href={affiliateLink} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex items-center gap-2 min-h-[48px] px-6 text-sm font-extrabold uppercase tracking-wider text-white"
                style={{ background: CARBON, clipPath: CHAMFER }}>
                Voir l'offre <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </Block>
      )}

      <Block id="faq" title="Questions fréquentes">
        <div className="space-y-2 max-w-3xl">
          {seo.faq.map((it, i) => (
            <div key={it.q} className="bg-white" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
              <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full flex items-center gap-3 min-h-[56px] px-4 text-left">
                <h3 className="flex-1 text-base font-bold" style={{ fontFamily: FONT, color: CARBON }}>{it.q}</h3>
                <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {/* Réponse toujours dans le DOM (lisible par Google), seulement masquée visuellement. */}
              <p className={`px-4 pb-4 text-base text-[#374151] leading-relaxed ${open === i ? "" : "hidden"}`} style={{ fontFamily: FONT }}>{it.a}</p>
            </div>
          ))}
        </div>
      </Block>

      <section className="px-4 pb-10 lg:px-8" style={{ backgroundColor: "#FAFAF8" }}>
        <div className="mx-auto max-w-6xl lg:pl-[300px]">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-gray-500 mb-2" style={{ fontFamily: FONT }}>Sources</p>
          <ul className="space-y-1">
            {seo.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-gray-600 underline min-h-[32px] inline-flex items-center" style={{ fontFamily: FONT }}>{s.label}</a></li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
};

const ScooterSeoFiche = ({ seo, affiliateLink, mode = "tabs" }: { name?: string; seo: ScooterSeo; affiliateLink?: string | null; mode?: Mode }) =>
  mode === "tabs" ? <Tabs seo={seo} affiliateLink={affiliateLink} /> : <Long seo={seo} affiliateLink={affiliateLink} />;

export default ScooterSeoFiche;
