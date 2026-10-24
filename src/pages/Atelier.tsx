import { useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, PlayCircle, Wrench, MessageCircleQuestion } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AskAtelierForm from "@/components/atelier/AskAtelierForm";
import { useBlogIndex } from "@/lib/blog";
import { useAnsweredQuestions, useAtelierVideos } from "@/lib/atelier";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SITE = "https://piecestrottinettes.fr";

/* 24/10/2026 — « L'Atelier » : le hub (guides, vidéos, tutos, questions). Plan claude/PT-lot-atelier-hub.md. */
const Atelier = () => {
  const [params] = useSearchParams();
  const trottSlug = params.get("trott");
  const trottName = params.get("nom");
  const { data: guides } = useBlogIndex();
  const { data: videos } = useAtelierVideos();
  const { data: questions } = useAnsweredQuestions({ limit: 12 });
  const { hash } = useLocation();
  // Lien « Poser ma question » depuis une fiche : on arrive directement sur le formulaire.
  useEffect(() => {
    if (hash === "#question") window.setTimeout(() => document.getElementById("question")?.scrollIntoView({ behavior: "smooth" }), 150);
  }, [hash]);

  const doors = [
    { to: "/blog", icon: BookOpen, title: "Guides", text: "Choisir, comparer, entretenir.", count: guides?.length, unit: "guide" },
    { to: "/atelier/videos", icon: PlayCircle, title: "Vidéos", text: "Les meilleurs tests, rangés par trottinette.", count: videos?.length, unit: "vidéo" },
    { to: "/tutos", icon: Wrench, title: "Tutos", text: "Changer un pneu, des plaquettes, un chargeur.", count: undefined, unit: "" },
    { to: "#question", icon: MessageCircleQuestion, title: "Questions", text: "Pose ta question, un réparateur répond.", count: questions?.length, unit: "réponse" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8", fontFamily: FONT }}>
      <SEO
        title="L'Atelier : guides, vidéos et questions trottinette"
        description="Pose ta question à un atelier de réparation de trottinettes électriques à Marseille. Guides d'achat, tutos d'entretien et vidéos rangées par modèle, avec les pièces compatibles."
        canonical={`${SITE}/atelier`}
        schema={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "L'Atelier — Pièces Trottinettes", url: `${SITE}/atelier` }}
      />
      <Header />
      <main className="flex-1 px-4 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>L'Atelier</p>
          <h1 className="mt-2 text-3xl lg:text-5xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>
            Une panne, un doute ? Demande à l'atelier
          </h1>
          <p className="mt-4 max-w-2xl text-base lg:text-lg text-[#374151] leading-relaxed">
            On répare des trottinettes tous les jours à Marseille. Ici, on partage ce qu'on voit : guides, vidéos, tutos, et les réponses aux questions des riders.
          </p>

          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {doors.map((d) => {
              const Icon = d.icon;
              const inner = (
                <>
                  <Icon className="w-6 h-6" style={{ color: GREEN }} aria-hidden />
                  <span className="mt-3 block text-lg font-black uppercase tracking-tight" style={{ color: CARBON }}>{d.title}</span>
                  <span className="mt-1 block text-sm text-gray-600 leading-snug">{d.text}</span>
                  {d.count ? <span className="mt-3 block text-sm font-bold" style={{ color: GREEN }}>{d.count} {d.unit}{d.count > 1 ? "s" : ""}</span> : null}
                </>
              );
              const cls = "block min-h-[44px] rounded-2xl bg-white p-4 shadow-md hover:shadow-xl transition-all duration-200";
              return d.to.startsWith("#")
                ? <a key={d.title} href={d.to} className={cls}>{inner}</a>
                : <Link key={d.title} to={d.to} className={cls}>{inner}</Link>;
            })}
          </div>

          <section id="question" className="mt-12 scroll-mt-24 grid gap-6 lg:grid-cols-[1fr_1.1fr] items-start">
            <div>
              <h2 className="text-2xl lg:text-3xl uppercase font-black tracking-tight" style={{ color: CARBON }}>Pose ta question</h2>
              <p className="mt-2 text-base text-[#374151] leading-relaxed">
                Taille de pneu, frein qui couine, chargeur qui clignote, pièce compatible ou pas : un réparateur te répond sous 48 h. La réponse est publiée pour aider les autres riders, ton email ne l'est jamais.
              </p>
            </div>
            <AskAtelierForm scooterSlug={trottSlug} scooterName={trottName} />
          </section>

          <section className="mt-12">
            <h2 className="text-2xl lg:text-3xl uppercase font-black tracking-tight" style={{ color: CARBON }}>Les dernières réponses de l'atelier</h2>
            {questions && questions.length > 0 ? (
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {questions.map((q) => (
                  <li key={q.slug}>
                    <Link to={`/atelier/questions/${q.slug}`} className="group flex flex-col min-h-[44px] rounded-2xl bg-white p-4 shadow-md hover:shadow-xl transition-all duration-200">
                      {q.scooter_name && <span className="text-sm font-semibold" style={{ color: GREEN }}>{q.scooter_name}</span>}
                      <span className="mt-1 text-base font-bold leading-snug" style={{ color: CARBON }}>{q.titre}</span>
                      <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold" style={{ color: GREEN }}>Lire la réponse <ArrowRight className="w-4 h-4" /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-base text-gray-600">Les premières réponses arrivent : pose la tienne juste au-dessus.</p>
            )}
          </section>

          {guides && guides.length > 0 && (
            <section className="mt-12">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-2xl lg:text-3xl uppercase font-black tracking-tight" style={{ color: CARBON }}>Les guides</h2>
                <Link to="/blog" className="min-h-[44px] inline-flex items-center text-sm font-bold underline underline-offset-4" style={{ color: CARBON }}>Tous les guides</Link>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {guides.slice(0, 3).map((g) => (
                  <Link key={g.slug} to={`/blog/${g.slug}`} className="flex flex-col justify-between min-h-[44px] rounded-2xl bg-white p-4 shadow-md hover:shadow-xl transition-all duration-200">
                    <span>
                      <span className="block text-sm font-semibold" style={{ color: GREEN }}>{g.category}</span>
                      <span className="mt-1 block text-base font-bold leading-snug" style={{ color: CARBON }}>{g.title}</span>
                    </span>
                    <span className="mt-3 text-sm font-bold" style={{ color: GREEN }}>Lire · {g.readMinutes} min</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Atelier;
