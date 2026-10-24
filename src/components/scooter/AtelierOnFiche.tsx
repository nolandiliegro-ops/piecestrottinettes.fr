/* Fiche trottinette — blocs « Les conseils de l'atelier » + « Une question sur ta … ? » (24/10/2026, Nolan :
   « ça va pas du tout, c'est à l'ancienne direction artistique ») : police d'affichage d'avant, cartes arrondies
   à ombre, bouton arrondi. Propositions derrière ?conseils=1..5 ; sans paramètre : blocs inchangés.
   Mêmes données : guides de public/blog/index.json (même tri que ScooterGuides), questions répondues du modèle. */
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, MessageCircleQuestion } from "lucide-react";
import { useBlogIndex, type BlogSummary } from "@/lib/blog";
import { useAnsweredQuestions } from "@/lib/atelier";
import { laName } from "@/lib/article";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SOFT = "#8FBF9C";
const LINE = "#E7E1D6";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

export type ConseilsLook = 1 | 2 | 3 | 4 | 5;
export const conseilsParam = (): ConseilsLook | null => {
  if (typeof window === "undefined") return null;
  const n = Number(new URLSearchParams(window.location.search).get("conseils"));
  return n >= 1 && n <= 5 ? (n as ConseilsLook) : null;
};

const rank = (a: BlogSummary, slug: string, brandSlug?: string | null) =>
  a.scooters?.includes(slug) ? 0 : brandSlug && a.brands?.includes(brandSlug) ? 1 : a.everywhere ? 2 : -1;
/** Photo maison par catégorie de guide (photos du site, jamais de vignette tierce). */
const PHOTO: Record<string, string> = {
  Entretien: "/categories/pneus-b.webp",
  "Guide d'achat": "/brand-heroes/navee.webp",
  Comparatif: "/brand-heroes/dualtron.webp",
  "Choisir dans une gamme": "/brand-heroes/kukirin.webp",
};
const photoOf = (c: string) => PHOTO[c] ?? "/categories/plaquettes-b.webp";

const H2 = ({ children, light = false, id }: { children: React.ReactNode; light?: boolean; id?: string }) => (
  <h2 id={id} className="text-[24px] lg:text-[32px] uppercase leading-[1]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: light ? "#fff" : CARBON }}>{children}</h2>
);
const Kicker = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <p className="text-sm font-extrabold uppercase tracking-[0.16em]" style={{ fontFamily: FONT, color: light ? SOFT : GREEN }}>{children}</p>
);
const AskButton = ({ to, light = false, full = false }: { to: string; light?: boolean; full?: boolean }) => (
  <Link to={to} className={`group inline-flex items-center justify-between gap-4 min-h-[56px] px-6 ${full ? "w-full" : "w-full sm:w-auto"} text-[15px] font-extrabold uppercase tracking-wide transition-colors`}
    style={{ fontFamily: FONT, clipPath: cut(12), background: light ? "#fff" : GREEN, color: light ? CARBON : "#fff" }}>
    Poser ma question <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
  </Link>
);

export const AtelierOnFiche = ({ look, slug, brandSlug, scooterName }: { look: ConseilsLook; slug: string; brandSlug?: string | null; scooterName: string }) => {
  const { data: blog } = useBlogIndex();
  const { data: qs } = useAnsweredQuestions({ scooterSlug: slug, limit: 6 });
  const guides = (blog ?? []).map((a) => ({ a, r: rank(a, slug, brandSlug) })).filter((x) => x.r >= 0).sort((x, y) => x.r - y.r).slice(0, 3).map((x) => x.a);
  const questions = qs ?? [];
  const ask = `/atelier?trott=${encodeURIComponent(slug)}&nom=${encodeURIComponent(scooterName)}#question`;
  const ta = laName(scooterName); // « la Dualtron Popular », « l'Apollo… »
  const tta = `ta ${scooterName}`;

  const QuestionLinks = ({ dark = false }: { dark?: boolean }) => questions.length ? (
    <ul className="grid gap-2">
      {questions.map((q) => (
        <li key={q.slug}>
          <Link to={`/atelier/questions/${q.slug}`} className="flex items-center justify-between gap-3 min-h-[52px] px-4"
            style={{ fontFamily: FONT, clipPath: cut(10), background: dark ? "#242424" : "#fff", boxShadow: dark ? "none" : `inset 0 0 0 1px ${LINE}` }}>
            <span className="text-base font-bold leading-snug" style={{ color: dark ? "#fff" : CARBON }}>{q.titre}</span>
            <ArrowRight className="w-4 h-4 shrink-0" style={{ color: dark ? SOFT : GREEN }} />
          </Link>
        </li>
      ))}
    </ul>
  ) : null;

  // 1 · Repassé : même ordre (conseils puis question), même contenu, passé dans la DA : Unbounded italique,
  // cartes blanches à angle coupé, bouton à angle coupé.
  if (look === 1) return (
    <section className="px-4 py-10 lg:px-8" style={{ backgroundColor: "#FAFAF8" }} aria-labelledby="guides-atelier">
      <div className="mx-auto max-w-6xl">
        {guides.length > 0 && <>
          <Kicker>L'atelier conseille</Kicker>
          <H2 id="guides-atelier">Les conseils de l'atelier</H2>
          <p className="mt-2 text-base text-[#4B5563]" style={{ fontFamily: FONT }}>Pour bien choisir et entretenir {ta}.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {guides.map((g) => (
              <Link key={g.slug} to={`/blog/${g.slug}`} className="group flex flex-col justify-between bg-white p-5 min-h-[150px]" style={{ clipPath: cut(14), boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
                <span>
                  <span className="text-sm font-extrabold uppercase tracking-wider" style={{ color: GREEN }}>{g.category}</span>
                  <span className="block mt-2 text-lg font-extrabold leading-snug" style={{ color: CARBON }}>{g.title}</span>
                </span>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide" style={{ color: CARBON }}>Lire le guide · {g.readMinutes} min <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: GREEN }} /></span>
              </Link>
            ))}
          </div>
        </>}
        <div className={guides.length ? "mt-10" : ""}>
          <Kicker>L'atelier répond</Kicker>
          <H2 id="questions-atelier">Une question sur {tta} ?</H2>
          <p className="mt-2 text-base text-[#4B5563]" style={{ fontFamily: FONT }}>Un réparateur de l'atelier te répond sous 48 h.</p>
          {questions.length > 0 && <div className="mt-4 grid md:grid-cols-2 gap-2"><QuestionLinks /></div>}
          <div className="mt-4"><AskButton to={ask} /></div>
        </div>
      </div>
    </section>
  );

  // 2 · Cartes photo : chaque guide a sa photo (photos du site par catégorie) ; la question devient un bandeau carbone.
  if (look === 2) return (
    <section className="px-4 py-10 lg:px-8" style={{ backgroundColor: "#FAFAF8" }} aria-labelledby="guides-atelier">
      <div className="mx-auto max-w-6xl">
        {guides.length > 0 && <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><Kicker>L'atelier conseille</Kicker><H2 id="guides-atelier">Les conseils de l'atelier</H2></div>
            <Link to="/blog" className="min-h-[44px] inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide underline underline-offset-4" style={{ fontFamily: FONT, color: CARBON }}>Tous les guides <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {guides.map((g) => (
              <Link key={g.slug} to={`/blog/${g.slug}`} className="group bg-white flex flex-col" style={{ clipPath: cut(16), boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
                <div className="relative h-36 overflow-hidden">
                  <img src={photoOf(g.category)} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 px-2 py-1 text-sm font-extrabold uppercase tracking-wider text-white" style={{ background: GREEN, clipPath: cut(6) }}>{g.category}</span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <span className="text-lg font-extrabold leading-snug" style={{ color: CARBON }}>{g.title}</span>
                  <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#4B5563]">{g.readMinutes} min de lecture <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: GREEN }} /></span>
                </div>
              </Link>
            ))}
          </div>
        </>}
        <div className={`${guides.length ? "mt-8" : ""} p-5 lg:p-7 grid lg:grid-cols-[1fr_auto] gap-5 items-center`} style={{ background: CARBON, clipPath: cut(18) }}>
          <div className="min-w-0">
            <Kicker light>L'atelier répond</Kicker>
            <H2 light id="questions-atelier">Une question sur {tta} ?</H2>
            <p className="mt-2 text-base text-white/75" style={{ fontFamily: FONT }}>Un réparateur de l'atelier te répond sous 48 h.</p>
            {questions.length > 0 && <div className="mt-4"><QuestionLinks dark /></div>}
          </div>
          <AskButton to={ask} light />
        </div>
      </div>
    </section>
  );

  // 3 · Bande carbone : une seule bande « L'atelier », guides en lignes, question et bouton blanc à droite.
  if (look === 3) return (
    <section className="px-4 py-12 lg:px-8" style={{ backgroundColor: CARBON }} aria-labelledby="guides-atelier">
      <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.3fr_1fr] gap-8">
        <div className="min-w-0">
          <Kicker light>L'atelier conseille</Kicker>
          <H2 light id="guides-atelier">Les conseils de l'atelier</H2>
          <ul className="mt-4 grid gap-2">
            {guides.map((g) => (
              <li key={g.slug}><Link to={`/blog/${g.slug}`} className="group flex items-center justify-between gap-4 min-h-[64px] px-4 py-3" style={{ background: "#242424", clipPath: cut(10), fontFamily: FONT }}>
                <span className="min-w-0"><span className="block text-sm font-extrabold uppercase tracking-wider" style={{ color: SOFT }}>{g.category} · {g.readMinutes} min</span><span className="block text-base font-bold text-white leading-snug">{g.title}</span></span>
                <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: SOFT }} />
              </Link></li>
            ))}
          </ul>
        </div>
        <div className="min-w-0">
          <Kicker light>L'atelier répond</Kicker>
          <H2 light id="questions-atelier">Une question sur {tta} ?</H2>
          <p className="mt-2 text-base text-white/75" style={{ fontFamily: FONT }}>Un réparateur de l'atelier te répond sous 48 h.</p>
          {questions.length > 0 && <div className="mt-4"><QuestionLinks dark /></div>}
          <div className="mt-4"><AskButton to={ask} light full /></div>
        </div>
      </div>
    </section>
  );

  // 4 · Deux colonnes : les guides à gauche, une carte « question » verte à droite qui reste en vue.
  if (look === 4) return (
    <section className="px-4 py-10 lg:px-8" style={{ backgroundColor: "#FAFAF8" }} aria-labelledby="guides-atelier">
      <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <div className="min-w-0">
          <Kicker>L'atelier conseille</Kicker>
          <H2 id="guides-atelier">Les conseils de l'atelier</H2>
          <div className="mt-4 grid gap-3">
            {guides.map((g) => (
              <Link key={g.slug} to={`/blog/${g.slug}`} className="group grid grid-cols-[96px_1fr] sm:grid-cols-[132px_1fr] bg-white overflow-hidden" style={{ clipPath: cut(14), boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
                <img src={photoOf(g.category)} alt="" loading="lazy" className="w-full h-full min-h-[104px] object-cover" />
                <span className="p-4 flex flex-col justify-center">
                  <span className="text-sm font-extrabold uppercase tracking-wider" style={{ color: GREEN }}>{g.category} · {g.readMinutes} min</span>
                  <span className="mt-1 text-base lg:text-lg font-extrabold leading-snug" style={{ color: CARBON }}>{g.title}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="lg:sticky lg:top-24 p-5 lg:p-6 text-white" style={{ background: GREEN, clipPath: cut(18) }}>
          <MessageCircleQuestion className="w-8 h-8" />
          <p className="mt-3 text-[22px] lg:text-[26px] uppercase leading-[1]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }} id="questions-atelier">Une question sur {tta} ?</p>
          <p className="mt-2 text-base text-white/85" style={{ fontFamily: FONT }}>Pneu, frein, pièce compatible ou pas : un réparateur te répond sous 48 h.</p>
          <div className="mt-4"><AskButton to={ask} light full /></div>
          {questions.length > 0 && <div className="mt-4"><QuestionLinks /></div>}
        </div>
      </div>
    </section>
  );

  // 5 · Sobre : un titre, des lignes avec flèche séparées par un filet, un bouton. Rien d'autre.
  return (
    <section className="px-4 py-10 lg:px-8" style={{ backgroundColor: "#FAFAF8" }} aria-labelledby="guides-atelier">
      <div className="mx-auto max-w-6xl border-t-2 pt-6" style={{ borderColor: CARBON }}>
        <H2 id="guides-atelier">L'atelier pour {ta}</H2>
        <ul className="mt-4">
          {guides.map((g) => (
            <li key={g.slug} className="border-b" style={{ borderColor: LINE }}>
              <Link to={`/blog/${g.slug}`} className="group flex items-center justify-between gap-4 min-h-[60px] py-3" style={{ fontFamily: FONT }}>
                <span className="flex items-center gap-3 min-w-0"><BookOpen className="w-5 h-5 shrink-0" style={{ color: GREEN }} /><span className="text-base lg:text-lg font-bold leading-snug" style={{ color: CARBON }}>{g.title}</span></span>
                <span className="shrink-0 text-sm font-bold text-[#4B5563] inline-flex items-center gap-1">{g.readMinutes} min <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            </li>
          ))}
          {questions.map((q) => (
            <li key={q.slug} className="border-b" style={{ borderColor: LINE }}>
              <Link to={`/atelier/questions/${q.slug}`} className="group flex items-center justify-between gap-4 min-h-[60px] py-3" style={{ fontFamily: FONT }}>
                <span className="flex items-center gap-3 min-w-0"><MessageCircleQuestion className="w-5 h-5 shrink-0" style={{ color: GREEN }} /><span className="text-base lg:text-lg font-bold leading-snug" style={{ color: CARBON }}>{q.titre}</span></span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          <AskButton to={ask} />
          <span className="text-base text-[#4B5563]" style={{ fontFamily: FONT }} id="questions-atelier">Une question sur {tta} ? Un réparateur te répond sous 48 h.</span>
        </div>
      </div>
    </section>
  );
};
