import { Link, useParams } from "react-router-dom";
import { ArrowRight, ShieldCheck, Wrench } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { partnerOf } from "@/config/partners";
import { useBlogArticle, useBlogParts, useBlogScooters, formatBlogDate, type BlogScooter, type BlogPart } from "@/lib/blog";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";
const SITE = "https://piecestrottinettes.fr";

const num = (v: number | null, unit: string) => (v == null ? "—" : `${v.toLocaleString("fr-FR")} ${unit}`);

const ScooterCard = ({ s }: { s: BlogScooter }) => {
  const p = partnerOf(s.affiliate_link);
  return (
    <div className="mt-5 bg-white p-4 lg:p-5 grid sm:grid-cols-[160px_1fr] gap-4 items-center" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
      {s.image_url ? <img src={s.image_url} alt={s.name} loading="lazy" className="w-full max-w-[200px] mx-auto aspect-square object-contain" /> : <div />}
      <div>
        <p className="text-lg uppercase leading-snug" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{s.name}</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-[#374151]">
          <dt className="text-gray-500">Moteur</dt><dd>{num(s.power_watts, "W")}</dd>
          <dt className="text-gray-500">Autonomie annoncée</dt><dd>{num(s.range_km, "km")}</dd>
          <dt className="text-gray-500">Poids</dt><dd>{num(s.weight_kg, "kg")}</dd>
          <dt className="text-gray-500">Roues</dt><dd>{s.tire_size || "—"}</dd>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/scooter/${s.slug}`} className="inline-flex items-center gap-2 min-h-[44px] px-4 text-sm font-extrabold uppercase tracking-wider"
            style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${CARBON}`, color: CARBON }}>
            <Wrench className="w-4 h-4" /> Fiche et pièces
          </Link>
          {p && s.affiliate_link && (
            <a href={s.affiliate_link} target="_blank" rel="sponsored noopener noreferrer" data-placement="blog"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 text-sm font-extrabold uppercase tracking-wider text-white"
              style={{ clipPath: CHAMFER, background: "#FF6600" }}>
              Voir chez {p.name} <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const PartLinks = ({ label, slugs, parts }: { label: string; slugs: string[]; parts: Record<string, BlogPart> }) => {
  const list = slugs.map((s) => parts[s]).filter(Boolean) as BlogPart[];
  if (!list.length) return null;
  return (
    <div className="mt-4">
      <p className="text-sm font-extrabold uppercase tracking-[0.12em]" style={{ color: GREEN }}>{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {list.map((p) => (
          <Link key={p.slug} to={`/piece/${p.slug}`} className="inline-flex items-center gap-2 min-h-[44px] bg-white px-3 text-sm text-[#374151]"
            style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
            {p.image_url && <img src={p.image_url} alt="" loading="lazy" className="w-8 h-8 object-contain" />}
            <span className="line-clamp-1">{p.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

const CompareTable = ({ title, slugs, scooters }: { title: string; slugs: string[]; scooters: Record<string, BlogScooter> }) => {
  const rows = slugs.map((s) => scooters[s]).filter(Boolean) as BlogScooter[];
  if (!rows.length) return null;
  return (
    <section className="mt-10">
      <h2 className="text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{title}</h2>
      <div className="mt-4 -mx-4 px-4 overflow-x-auto">
        <table className="min-w-[640px] w-full bg-white text-sm" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
          <thead>
            <tr className="text-left" style={{ background: "#EFE9DD", color: CARBON }}>
              {["Modèle", "Moteur", "Vitesse bridée", "Autonomie annoncée", "Poids", "Roues"].map((h) => <th key={h} className="px-3 py-3 font-extrabold uppercase tracking-wider">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.slug} className="border-t" style={{ borderColor: LINE }}>
                <td className="px-3 py-3 font-bold"><Link to={`/scooter/${s.slug}`} className="underline underline-offset-2" style={{ color: CARBON }}>{s.name}</Link></td>
                <td className="px-3 py-3">{num(s.power_watts, "W")}</td>
                <td className="px-3 py-3">{num(s.max_speed_kmh, "km/h")}</td>
                <td className="px-3 py-3">{num(s.range_km, "km")}</td>
                <td className="px-3 py-3">{num(s.weight_kg, "kg")}</td>
                <td className="px-3 py-3">{s.tire_size || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-gray-500">Chiffres du constructeur, tenus à jour dans notre base. L'autonomie réelle est en général nettement plus basse.</p>
    </section>
  );
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: a, isLoading } = useBlogArticle(slug);
  const scooterSlugs = a ? [...(a.compare?.scooters ?? []), ...a.sections.flatMap((s) => (s.scooter ? [s.scooter] : []))] : [];
  const partSlugs = a ? a.sections.flatMap((s) => (s.parts ?? []).flatMap((p) => p.slugs)) : [];
  const { data: scooters = {} } = useBlogScooters(scooterSlugs);
  const { data: parts = {} } = useBlogParts(partSlugs);

  if (isLoading) return <div className="min-h-screen" style={{ backgroundColor: "#F5F0E8" }}><Header /><p className="px-4 py-16 text-center text-base text-gray-500">Chargement…</p></div>;
  if (!a) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8", fontFamily: FONT }}>
        <SEO title="Article introuvable" description="Cet article n'existe pas ou plus." noindex />
        <Header />
        <main className="flex-1 px-4 py-16 text-center">
          <p className="text-lg text-[#374151]">Cet article n'existe pas ou plus.</p>
          <Link to="/blog" className="mt-4 inline-block font-extrabold uppercase tracking-wider underline" style={{ color: GREEN }}>Tous les articles</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const url = `${SITE}/blog/${a.slug}`;
  const hasPartner = Object.values(scooters).some((s) => partnerOf(s.affiliate_link));
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8", fontFamily: FONT }}>
      <SEO
        title={a.metaTitle}
        description={a.metaDescription}
        canonical={url}
        schema={[
          { "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.metaDescription, dateModified: a.updated, datePublished: a.updated,
            author: { "@type": "Organization", name: "Pièces Trottinettes", url: SITE }, publisher: { "@type": "Organization", name: "Pièces Trottinettes", url: SITE }, mainEntityOfPage: url },
          { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: SITE },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
            { "@type": "ListItem", position: 3, name: a.title, item: url },
          ] },
          ...(a.faq.length ? [{ "@context": "https://schema.org", "@type": "FAQPage",
            mainEntity: a.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] : []),
        ]}
      />
      <Header />
      <main className="flex-1 px-4 py-8 lg:px-8 lg:py-12">
        <article className="mx-auto max-w-3xl">
          <nav className="text-sm text-gray-500" aria-label="Fil d'Ariane">
            <Link to="/" className="hover:underline">Accueil</Link> › <Link to="/blog" className="hover:underline">Blog</Link> › <span>{a.category}</span>
          </nav>
          <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>{a.category}</p>
          <h1 className="mt-2 text-3xl lg:text-4xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>{a.title}</h1>
          <p className="mt-3 text-sm text-gray-500">Mis à jour le {formatBlogDate(a.updated)} · {a.readMinutes} min de lecture</p>

          <div className="mt-6 bg-white p-5" style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>Le verdict de l'atelier</p>
            <ul className="mt-3 space-y-2 text-base text-[#374151] leading-relaxed list-disc pl-5">{a.verdict.map((v, i) => <li key={i}>{v}</li>)}</ul>
          </div>

          {hasPartner && (
            <p className="mt-4 flex items-start gap-2 text-sm text-gray-500"><ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Transparence : certains boutons mènent chez des vendeurs partenaires. Si tu achètes par ce lien, on touche une petite commission, sans surcoût pour toi. Ça ne change pas ce qu'on écrit.</span></p>
          )}

          {a.compare && <CompareTable title={a.compare.title} slugs={a.compare.scooters} scooters={scooters} />}

          {a.sections.map((s) => (
            <section key={s.id} id={s.id} className="mt-10 scroll-mt-24">
              <h2 className="text-xl lg:text-2xl uppercase leading-snug" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{s.h2}</h2>
              <div className="mt-3 space-y-4 text-base lg:text-lg text-[#374151] leading-relaxed">{s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
              {s.bullets && <ul className="mt-3 space-y-2 text-base text-[#374151] leading-relaxed list-disc pl-5">{s.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
              {s.atelier && (
                <blockquote className="mt-4 bg-white p-4 text-base text-[#374151] leading-relaxed" style={{ boxShadow: `inset 4px 0 0 #FF6600, inset 0 0 0 1px ${LINE}` }}>
                  <p className="text-sm font-extrabold uppercase tracking-[0.12em]" style={{ color: CARBON }}>Vu à l'atelier</p>
                  <p className="mt-1">{s.atelier}</p>
                </blockquote>
              )}
              {s.scooter && scooters[s.scooter] && <ScooterCard s={scooters[s.scooter]} />}
              {(s.parts ?? []).map((p) => <PartLinks key={p.label} label={p.label} slugs={p.slugs} parts={parts} />)}
            </section>
          ))}

          {a.faq.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl lg:text-2xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Questions fréquentes</h2>
              <div className="mt-4 space-y-3">
                {a.faq.map((f, i) => (
                  <details key={i} className="bg-white p-4" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }} open={i === 0}>
                    <summary className="cursor-pointer text-base font-bold" style={{ color: CARBON }}>{f.q}</summary>
                    <p className="mt-2 text-base text-[#374151] leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {a.sources.length > 0 && (
            <details className="mt-10 text-sm text-gray-500">
              <summary className="cursor-pointer font-bold">Sources ({a.sources.length})</summary>
              <ul className="mt-2 space-y-1 list-disc pl-5">{a.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">{s.label}</a></li>)}</ul>
            </details>
          )}

          <Link to="/blog" className="mt-10 inline-flex items-center gap-2 min-h-[44px] font-extrabold uppercase tracking-wider" style={{ color: GREEN }}>Tous les articles <ArrowRight className="w-4 h-4" /></Link>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogArticle;
