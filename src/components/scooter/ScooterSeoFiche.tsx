/**
 * Fiche trottinette complète (pilote SEO du 17/10/2026). Remplace le simple paragraphe « Présentation »
 * quand le modèle a une entrée dans src/data/scooterSeo.ts.
 * Sections : présentation (H2 avec le nom du modèle), fiche technique, points forts / limites,
 * pièces d'usure et tailles exactes (liens vers nos fiches pièces), entretien, prix / où l'acheter, FAQ, sources.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronDown, Minus } from "lucide-react";
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

const ScooterSeoFiche = ({ seo, affiliateLink }: { name?: string; seo: ScooterSeo; affiliateLink?: string | null }) => {
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

export default ScooterSeoFiche;
