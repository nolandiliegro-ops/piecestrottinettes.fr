import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { useBlogIndex, type BlogSummary } from "@/lib/blog";

/* 24/10/2026 (Nolan) : chaque fiche trottinette renvoie vers les guides de l'atelier qui la concernent.
   Lien interne fiche → article (SEO) et article → pièces / partenaire (vente). Rien ne s'affiche s'il n'y a
   aucun guide pertinent. Correspondance lue dans public/blog/index.json :
   `scooters` (slugs cités dans l'article) > `brands` (slug de marque) > `everywhere` (entretien général). */

const rank = (a: BlogSummary, slug: string, brandSlug?: string | null) =>
  a.scooters?.includes(slug) ? 0 : brandSlug && a.brands?.includes(brandSlug) ? 1 : a.everywhere ? 2 : -1;

const ScooterGuides = ({ slug, brandSlug, scooterName }: { slug: string; brandSlug?: string | null; scooterName: string }) => {
  const { data } = useBlogIndex();
  const guides = (data ?? [])
    .map((a) => ({ a, r: rank(a, slug, brandSlug) }))
    .filter((x) => x.r >= 0)
    .sort((x, y) => x.r - y.r)
    .slice(0, 3)
    .map((x) => x.a);
  if (guides.length === 0) return null;

  return (
    <section className="px-4 py-10 lg:px-8" style={{ backgroundColor: "#FAFAF8" }} aria-labelledby="guides-atelier">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-green-700" aria-hidden />
          <h2 id="guides-atelier" className="font-display text-2xl md:text-3xl uppercase tracking-tight font-black text-[#1A1A1A]">
            Les conseils de l'atelier
          </h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">Pour bien choisir et entretenir ta {scooterName}.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {guides.map((g) => (
            <Link
              key={g.slug}
              to={`/blog/${g.slug}`}
              className="group flex flex-col justify-between min-h-[44px] rounded-2xl bg-white p-4 shadow-md hover:shadow-xl transition-all duration-200"
            >
              <span>
                <span className="block text-sm font-semibold text-green-700">{g.category}</span>
                <span className="block mt-1 text-base font-bold leading-snug text-[#1A1A1A]">{g.title}</span>
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-green-700">
                Lire le guide · {g.readMinutes} min <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScooterGuides;
