import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAtelierQuestion, formatFrDate } from "@/lib/atelier";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SITE = "https://piecestrottinettes.fr";

/* 24/10/2026 — une question de rider répondue par l'atelier = une page indexable (QAPage). */
const AtelierQuestion = () => {
  const { slug } = useParams();
  const { data: q, isLoading } = useAtelierQuestion(slug);

  if (!isLoading && !q) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8", fontFamily: FONT }}>
        <SEO title="Question introuvable" description="Cette question n'existe pas ou n'a pas encore de réponse." noindex />
        <Header />
        <main className="flex-1 px-4 py-16 text-center">
          <p className="text-lg font-bold" style={{ color: CARBON }}>Cette question n'est pas (encore) publiée.</p>
          <Link to="/atelier" className="mt-4 inline-flex min-h-[44px] items-center font-bold underline underline-offset-4" style={{ color: GREEN }}>Retour à l'Atelier</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const paragraphs = (q?.reponse ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const desc = q ? (q.reponse.replace(/\s+/g, " ").slice(0, 150) + (q.reponse.length > 150 ? "…" : "")) : "";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8", fontFamily: FONT }}>
      {q && (
        <SEO
          title={q.titre.length > 60 ? q.titre.slice(0, 57) + "…" : q.titre}
          description={desc}
          canonical={`${SITE}/atelier/questions/${q.slug}`}
          schema={[{
            "@context": "https://schema.org", "@type": "QAPage",
            mainEntity: {
              "@type": "Question", name: q.titre, text: q.question, answerCount: 1, dateCreated: q.created_at,
              acceptedAnswer: { "@type": "Answer", text: q.reponse, dateCreated: q.repondu_le ?? undefined, author: { "@type": "Organization", name: "L'atelier Pièces Trottinettes" } },
            },
          }, {
            "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
              { "@type": "ListItem", position: 1, name: "L'Atelier", item: `${SITE}/atelier` },
              { "@type": "ListItem", position: 2, name: q.titre, item: `${SITE}/atelier/questions/${q.slug}` },
            ],
          }]}
        />
      )}
      <Header />
      <main className="flex-1 px-4 py-10 lg:px-8">
        <article className="mx-auto max-w-3xl">
          <Link to="/atelier" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-bold" style={{ color: GREEN }}>
            <ArrowLeft className="w-4 h-4" /> L'Atelier
          </Link>
          {isLoading || !q ? (
            <p className="mt-6 text-base text-gray-500">Chargement…</p>
          ) : (
            <>
              {q.scooter_name && <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.12em]" style={{ color: GREEN }}>{q.scooter_name}</p>}
              <h1 className="mt-2 text-2xl lg:text-4xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>
                {q.titre}
              </h1>
              <div className="mt-6 rounded-2xl bg-white p-4 md:p-5 shadow-md">
                <p className="text-sm font-bold text-gray-500">La question d'un rider</p>
                <p className="mt-1 text-base leading-relaxed whitespace-pre-line" style={{ color: CARBON }}>{q.question}</p>
              </div>
              <div className="mt-4 rounded-2xl p-4 md:p-5" style={{ background: "#EFE9DD", boxShadow: `inset 4px 0 0 ${GREEN}` }}>
                <p className="text-sm font-bold" style={{ color: GREEN }}>
                  La réponse de l'atelier{q.repondu_par ? ` · ${q.repondu_par}` : ""}{q.repondu_le ? ` · ${formatFrDate(q.repondu_le)}` : ""}
                </p>
                <div className="mt-2 space-y-3">
                  {paragraphs.map((p, i) => <p key={i} className="text-base leading-relaxed whitespace-pre-line" style={{ color: CARBON }}>{p}</p>)}
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {q.scooter_slug && (
                  <Link to={`/scooter/${q.scooter_slug}`} className="min-h-[48px] px-6 rounded-lg font-semibold text-white bg-green-700 hover:bg-green-800 inline-flex items-center justify-center gap-2">
                    Les pièces compatibles {q.scooter_name ? `avec la ${q.scooter_name}` : ""} <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                <Link to="/atelier#question" className="min-h-[48px] px-6 rounded-lg font-semibold border border-gray-300 bg-white inline-flex items-center justify-center" style={{ color: CARBON }}>
                  Poser ma question
                </Link>
              </div>
            </>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default AtelierQuestion;
