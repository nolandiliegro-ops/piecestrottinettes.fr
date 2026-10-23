import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useBlogIndex, formatBlogDate } from "@/lib/blog";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";
const SITE = "https://piecestrottinettes.fr";

const Blog = () => {
  const { data: list, isLoading, error } = useBlogIndex();
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8", fontFamily: FONT }}>
      <SEO
        title="Le blog de l'atelier : guides et comparatifs trottinettes"
        description="Guides d'achat, comparatifs et conseils d'entretien de trottinettes électriques, écrits par un atelier de réparation à Marseille. Sources citées, sans blabla."
        canonical={`${SITE}/blog`}
        schema={{
          "@context": "https://schema.org", "@type": "Blog", name: "Le blog de l'atelier — Pièces Trottinettes", url: `${SITE}/blog`,
          blogPost: (list ?? []).map((a) => ({ "@type": "BlogPosting", headline: a.title, url: `${SITE}/blog/${a.slug}`, dateModified: a.updated })),
        }}
      />
      <Header />
      <main className="flex-1 px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>Le blog de l'atelier</p>
          <h1 className="mt-2 text-3xl lg:text-5xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>
            Choisir, comparer, entretenir sa trottinette
          </h1>
          <p className="mt-4 max-w-2xl text-base lg:text-lg text-[#374151] leading-relaxed">
            On répare des trottinettes tous les jours. Ici, on te dit ce qu'on sait, chiffres sourcés, pour acheter la bonne machine et la garder longtemps.
          </p>

          {isLoading && <p className="mt-10 text-base text-gray-500">Chargement des articles…</p>}
          {error && <p className="mt-10 text-base" style={{ color: "#DC2626" }}>Les articles n'ont pas pu être chargés. Recharge la page.</p>}

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {(list ?? []).map((a) => (
              <Link key={a.slug} to={`/blog/${a.slug}`} className="group block bg-white p-5 lg:p-6 transition-shadow hover:shadow-lg"
                style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
                <p className="text-sm font-extrabold uppercase tracking-[0.12em]" style={{ color: GREEN }}>{a.category}</p>
                <h2 className="mt-2 text-xl lg:text-2xl uppercase leading-snug" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{a.title}</h2>
                <p className="mt-3 text-base text-[#374151] leading-relaxed">{a.description}</p>
                <p className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span>Mis à jour le {formatBlogDate(a.updated)} · {a.readMinutes} min</span>
                  <span className="inline-flex items-center gap-1 font-extrabold uppercase tracking-wider" style={{ color: CARBON }}>Lire <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
