import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ChevronRight } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PartCard from "@/components/parts/PartCard";
import { useCategoryData } from "@/hooks/useCategoryData";
import { resolveCategoryIcon } from "@/lib/categoryIcons";
import { buildCategoryJsonLd } from "@/lib/categorySchema";
import { optimizedImage } from "@/lib/imageTransform";
import CategorySwitcher from "@/components/category/CategorySwitcher";

const FONT = "'Plus Jakarta Sans', sans-serif";
const HEAD = "'Anton', sans-serif";
const EASE = "cubic-bezier(0.32,0.72,0,1)";

// Film-grain texture (fixed, pointer-events-none) — physical paper feel (cf. Brand.tsx).
const GRAIN_BG =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const Categorie = () => {
  const { slug } = useParams<{ slug: string }>();
  const { category, parts, isLoading } = useCategoryData(slug);

  // Pagination "Voir plus" côté client (toutes les pièces sont déjà chargées).
  const [visibleCount, setVisibleCount] = useState(12);
  // Reset au changement de catégorie (le composant ne remonte pas entre 2 slugs).
  useEffect(() => setVisibleCount(12), [category?.id]);

  // Loading — until we know whether the category exists.
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
        <Loader2 className="w-10 h-10 animate-spin" strokeWidth={1.5} style={{ color: "#1A1A1A" }} />
      </div>
    );
  }

  // 404 — slug not found. True 404 (no redirect) for SEO.
  if (!category) {
    return (
      <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: "#F5F0E8" }}>
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center">
            <span className="text-7xl mb-6 block" aria-hidden>🛠️</span>
            <h1 className="text-4xl mb-3 uppercase" style={{ fontFamily: HEAD, color: "#1A1A1A", letterSpacing: "-0.01em" }}>
              Catégorie introuvable
            </h1>
            <p className="mb-8 max-w-md mx-auto text-base" style={{ color: "#6B7280", fontFamily: FONT }}>
              Cette catégorie n'existe pas ou n'est plus disponible.
            </p>
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-xl text-white text-sm font-bold uppercase tracking-wider"
              style={{ backgroundColor: "#4A7C59", fontFamily: FONT }}
            >
              Voir tout le catalogue
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const heading = category.seo_name || category.name;
  const neon = category.neon_color?.trim() || "#4A7C59";
  const Icon = resolveCategoryIcon(category.lucide_icon, category.slug);

  // Fallback indexable : compte LIVE (parts.length), aucune promesse non vérifiable.
  const fallbackText = `Toutes les pièces ${category.name} pour trottinette électrique : ${parts.length} références compatibles, sélectionnées par Steedy Trott.`;
  const bodyText = category.description?.trim() || fallbackText;

  const seoTitle = category.meta_title || `${category.name} — Pièces détachées trottinette`;
  const seoDescription = category.meta_description || fallbackText;
  const canonical = `https://piecestrottinettes.fr/categorie/${category.slug}`;

  const schema = buildCategoryJsonLd({
    name: heading,
    slug: category.slug,
    description: category.description || fallbackText,
    parts,
  });

  return (
    <div className="min-h-[100dvh] flex flex-col relative" style={{ backgroundColor: "#F5F0E8" }}>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={category.image_url ?? undefined}
        canonical={canonical}
        schema={schema}
        noindex={parts.length === 0}
      />

      {/* Film grain overlay — fixed, non-interactive. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-40 opacity-[0.03]" style={{ backgroundImage: GRAIN_BG }} />

      <Header />

      <main className="flex-1">
        {/* 1. Breadcrumb (matche le BreadcrumbList JSON-LD) */}
        <nav aria-label="Fil d'ariane" className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-5">
          <ol className="flex items-center gap-1.5 text-sm" style={{ fontFamily: FONT, color: "#6B7280" }}>
            <li>
              <Link to="/" className="inline-flex items-center min-h-[44px] hover:text-[#1A1A1A] transition-colors">Accueil</Link>
            </li>
            <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden />
            <li>
              <Link to="/catalogue" className="inline-flex items-center min-h-[44px] hover:text-[#1A1A1A] transition-colors">Catalogue</Link>
            </li>
            <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden />
            <li aria-current="page" className="inline-flex items-center min-h-[44px] font-semibold truncate" style={{ color: "#1A1A1A" }}>
              {category.name}
            </li>
          </ol>
        </nav>

        {/* 2. Hero catégorie — recâblage image / icône / accent_label / neon */}
        <section className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-3 pb-8 md:pb-12">
          <div
            className="relative overflow-hidden rounded-[2rem] ring-1 ring-black/5"
            style={{ boxShadow: `0 30px 60px -30px ${neon}40` }}
          >
            {/* Fond image .webp ou gradient carbon */}
            {category.image_url ? (
              <img
                src={optimizedImage(category.image_url, 1200)}
                alt={category.alt_text || category.name}
                loading="eager"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#1A1A1A 0%,#2c2c2c 100%)" }} />
            )}

            {/* Overlay sombre dégradé pour lisibilité */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.25) 100%)" }}
            />

            {/* Contenu hero */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              className="relative z-10 flex min-h-[320px] flex-col justify-end p-6 md:min-h-[420px] md:p-10"
            >
              {/* Badge icône avec glow néon */}
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${neon}66`, boxShadow: `0 0 28px ${neon}40` }}
              >
                <Icon className="h-7 w-7 text-white" strokeWidth={1.5} aria-hidden />
              </div>

              {/* Pill accent_label (recâblé) — uniquement si renseigné */}
              {category.accent_label && (
                <span
                  className="mb-3 inline-flex w-max items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: neon, border: `1px solid ${neon}`, boxShadow: `0 0 16px ${neon}55`, background: "rgba(0,0,0,0.25)" }}
                >
                  {category.accent_label}
                </span>
              )}

              {/* H1 = seo_name || name */}
              <h1
                className="uppercase text-white"
                style={{ fontFamily: HEAD, fontSize: "clamp(2rem,7vw,4rem)", lineHeight: 1, letterSpacing: "-0.01em" }}
              >
                {heading}
              </h1>
            </motion.div>
          </div>

          {/* Switcher : navigation horizontale vers les autres catégories */}
          <CategorySwitcher currentSlug={category.slug} />

          {/* 3. Texte indexable */}
          <p className="mt-6 max-w-2xl text-base md:text-lg" style={{ fontFamily: FONT, color: "#1A1A1A", lineHeight: 1.6 }}>
            {bodyText}
          </p>
        </section>

        {/* 4. Grille produits (déjà triée dispo-first par le hook) */}
        <section className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-20">
          {parts.length === 0 ? (
            <div className="mx-auto max-w-md rounded-[2rem] p-1.5 ring-1 ring-black/5" style={{ background: "rgba(0,0,0,0.035)" }}>
              <div
                className="rounded-[calc(2rem-0.375rem)] bg-white px-6 py-12 text-center"
                style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.7)" }}
              >
                <div
                  className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: `${neon}14`, border: `1px solid ${neon}33` }}
                >
                  <Icon className="h-7 w-7" strokeWidth={1.5} style={{ color: neon }} aria-hidden />
                </div>
                <p className="mb-6 text-base" style={{ fontFamily: FONT, color: "#1A1A1A" }}>
                  Aucune pièce dans cette catégorie pour le moment.
                </p>
                <Link
                  to="/catalogue"
                  className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-xl text-white text-sm font-bold uppercase tracking-wider transition-transform active:scale-[0.98]"
                  style={{ backgroundColor: "#4A7C59", fontFamily: FONT, transitionTimingFunction: EASE }}
                >
                  Voir tout le catalogue
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {parts.slice(0, visibleCount).map((p, i) => (
                  <PartCard key={p.id} part={p} index={i} />
                ))}
              </div>

              {visibleCount < parts.length && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 12)}
                    className="inline-flex items-center gap-2 min-h-[48px] px-8 rounded-xl border bg-white text-sm font-bold uppercase tracking-wider transition-transform hover:bg-[#1A1A1A]/[0.03] active:scale-[0.98]"
                    style={{ borderColor: "#1A1A1A", color: "#1A1A1A", fontFamily: FONT, transitionTimingFunction: EASE }}
                  >
                    Voir plus ({parts.length - visibleCount} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Categorie;
