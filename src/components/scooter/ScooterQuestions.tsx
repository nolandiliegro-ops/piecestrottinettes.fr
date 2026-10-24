import { Link } from "react-router-dom";
import { MessageCircleQuestion, ArrowRight } from "lucide-react";
import { useAnsweredQuestions } from "@/lib/atelier";

/* 24/10/2026 — fiche trottinette : questions de riders répondues par l'atelier sur CE modèle,
   et l'entrée « Pose ta question » préremplie avec la trottinette. */
const ScooterQuestions = ({ slug, scooterName }: { slug: string; scooterName: string }) => {
  const { data } = useAnsweredQuestions({ scooterSlug: slug, limit: 6 });
  const ask = `/atelier?trott=${encodeURIComponent(slug)}&nom=${encodeURIComponent(scooterName)}#question`;
  return (
    <section className="px-4 pb-10 lg:px-8" style={{ backgroundColor: "#FAFAF8" }} aria-labelledby="questions-atelier">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircleQuestion className="w-5 h-5 text-green-700" aria-hidden />
          <h2 id="questions-atelier" className="font-display text-2xl md:text-3xl uppercase tracking-tight font-black text-[#1A1A1A]">
            Une question sur ta {scooterName} ?
          </h2>
        </div>
        {data && data.length > 0 && (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {data.map((q) => (
              <li key={q.slug}>
                <Link to={`/atelier/questions/${q.slug}`} className="flex items-center justify-between gap-3 min-h-[44px] rounded-2xl bg-white p-4 shadow-md hover:shadow-xl transition-all duration-200">
                  <span className="text-base font-bold leading-snug text-[#1A1A1A]">{q.titre}</span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-green-700" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-gray-500">Un réparateur de l'atelier te répond sous 48 h.</p>
        <Link to={ask} className="mt-3 min-h-[48px] px-6 rounded-lg font-semibold text-white bg-green-700 hover:bg-green-800 inline-flex items-center gap-2">
          Poser ma question à l'atelier
        </Link>
      </div>
    </section>
  );
};

export default ScooterQuestions;
