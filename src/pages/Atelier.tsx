import { useEffect, type ReactNode, type CSSProperties } from "react";
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

  // 24/10 : 5 propositions de haut de page derrière ?atelier=1..5 (Nolan : « ça va pas du tout… il manque des images »).
  // Sans paramètre : rendu d'origine (seul le décalage sous la barre fixe est corrigé).
  const variant = Math.max(0, Math.min(5, Number(params.get("atelier") ?? 0) || 0));
  const vthumb = videos?.[0] ? `https://i.ytimg.com/vi/${videos[0].id}/hqdefault.jpg` : "/brand-heroes/dualtron.webp";
  const doors = [
    { to: "/blog", icon: BookOpen, title: "Guides", text: "Choisir, comparer, entretenir.", count: guides?.length, unit: "guide", img: "/brand-heroes/xiaomi.webp" },
    { to: "/atelier/videos", icon: PlayCircle, title: "Vidéos", text: "Les meilleurs tests, rangés par trottinette.", count: videos?.length, unit: "vidéo", img: vthumb },
    { to: "/tutos", icon: Wrench, title: "Tutos", text: "Changer un pneu, des plaquettes, un chargeur.", count: undefined, unit: "", img: "/categories/pneus-a.webp" },
    { to: "#question", icon: MessageCircleQuestion, title: "Questions", text: "Pose ta question, un réparateur répond.", count: questions?.length, unit: "réponse", img: "/categories/plaquettes-a.webp" },
  ];
  type Door = (typeof doors)[number];
  const go = (d: Door, cls: string, children: ReactNode, style?: CSSProperties) =>
    d.to.startsWith("#")
      ? <a key={d.title} href={d.to} className={cls} style={style}>{children}</a>
      : <Link key={d.title} to={d.to} className={cls} style={style}>{children}</Link>;
  const countTxt = (d: Door) => (d.count ? `${d.count} ${d.unit}${d.count > 1 ? "s" : ""}` : "");
  const H1 = ({ light = false, className = "" }: { light?: boolean; className?: string }) => (
    <h1 className={`text-3xl lg:text-5xl uppercase leading-[1.05] ${className}`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: light ? "#fff" : CARBON }}>
      Une panne, un doute ? Demande à l'atelier
    </h1>
  );
  const intro = "On répare des trottinettes tous les jours à Marseille. Ici, on partage ce qu'on voit : guides, vidéos, tutos, et les réponses aux questions des riders.";
  const kicker = <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ color: GREEN }}>L'Atelier</p>;
  const imgCard = (d: Door) => go(d, "group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-200", (
    <>
      <span className="block aspect-[16/10] overflow-hidden bg-[#EFE9DD]">
        <img src={d.img} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
      </span>
      <span className="flex-1 p-3 md:p-4">
        <span className="flex items-center gap-2 text-base md:text-lg font-black uppercase tracking-tight" style={{ color: CARBON }}>
          <d.icon className="w-5 h-5 shrink-0" style={{ color: GREEN }} aria-hidden /> {d.title}
        </span>
        <span className="mt-1 block text-sm text-gray-600 leading-snug">{d.text}</span>
        {countTxt(d) && <span className="mt-2 block text-sm font-bold" style={{ color: GREEN }}>{countTxt(d)}</span>}
      </span>
    </>
  ));

  const renderTop = (v: number) => {
    if (v === 1) return (
      <>
        {kicker}
        <H1 className="mt-2" />
        <p className="mt-4 max-w-2xl text-base lg:text-lg text-[#374151] leading-relaxed">{intro}</p>
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">{doors.map(imgCard)}</div>
      </>
    );
    if (v === 2) return (
      <>
        <div className="relative -mx-4 lg:mx-0 overflow-hidden lg:rounded-3xl min-h-[360px] lg:min-h-[420px] flex items-end">
          <img src="/brand-heroes/xiaomi.webp" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,26,26,0.05) 20%, rgba(26,26,26,0.85) 100%)" }} />
          <div className="relative p-5 lg:p-10 pb-16 lg:pb-20">
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-white/80">L'Atelier</p>
            <H1 light className="mt-2 max-w-3xl" />
            <p className="mt-3 max-w-2xl text-base text-white/85 leading-relaxed">{intro}</p>
          </div>
        </div>
        <div className="relative -mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 px-1 lg:px-6">{doors.map(imgCard)}</div>
      </>
    );
    if (v === 3) {
      const [g, vid, tuto, ask] = doors;
      return (
        <>
          {kicker}
          <H1 className="mt-2" />
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-3 lg:h-[440px]">
            {go(ask, "col-span-2 lg:row-span-2 flex flex-col justify-between rounded-2xl p-5 lg:p-7 text-white shadow-md hover:shadow-xl transition-all", (
              <>
                <MessageCircleQuestion className="w-8 h-8" aria-hidden />
                <span>
                  <span className="block text-2xl lg:text-4xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>Pose ta question</span>
                  <span className="mt-2 block text-base text-white/85">Un réparateur te répond sous 48 h. {countTxt(ask)}</span>
                  <span className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-5 rounded-lg bg-white font-semibold" style={{ color: CARBON }}>Écrire à l'atelier <ArrowRight className="w-4 h-4" /></span>
                </span>
              </>
            ), { background: GREEN })}
            {[g, vid, tuto].map((d, i) => go(d, `group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all min-h-[150px] ${i === 0 ? "col-span-2" : ""}`, (
              <>
                <img src={d.img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(26,26,26,0.8) 100%)" }} />
                <span className="absolute left-0 right-0 bottom-0 p-3 lg:p-4 text-white">
                  <span className="block text-lg font-black uppercase tracking-tight">{d.title}</span>
                  <span className="block text-sm text-white/85 leading-snug">{countTxt(d) || d.text}</span>
                </span>
              </>
            )))}
          </div>
          <p className="mt-6 max-w-2xl text-base text-[#374151] leading-relaxed">{intro}</p>
        </>
      );
    }
    if (v === 4) return (
      <>
        {kicker}
        <H1 className="mt-2" />
        <p className="mt-4 max-w-2xl text-base lg:text-lg text-[#374151] leading-relaxed">{intro}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {doors.map((d) => go(d, "inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-white border border-gray-300 text-sm font-bold uppercase tracking-wide hover:border-green-700", (
            <><d.icon className="w-4 h-4" style={{ color: GREEN }} aria-hidden /> {d.title}{countTxt(d) ? <span className="font-semibold normal-case text-gray-500"> · {countTxt(d)}</span> : null}</>
          ), { color: CARBON }))}
        </div>
        <div className="mt-6 -mx-4 px-4 flex gap-3 overflow-x-auto pb-2 snap-x [scrollbar-width:none]">
          {(videos ?? []).slice(0, 10).map((vd) => (
            <Link key={vd.slug + vd.id} to="/atelier/videos" className="snap-start shrink-0 w-[240px] lg:w-[280px] rounded-2xl overflow-hidden bg-white shadow-md">
              <span className="relative block aspect-video bg-[#1A1A1A]">
                <img src={`https://i.ytimg.com/vi/${vd.id}/hqdefault.jpg`} alt="" loading="lazy" className="w-full h-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center"><span className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center"><PlayCircle className="w-6 h-6" style={{ color: CARBON }} /></span></span>
              </span>
              <span className="block p-3 text-sm font-bold leading-snug line-clamp-2" style={{ color: CARBON }}>{vd.name}</span>
            </Link>
          ))}
        </div>
      </>
    );
    if (v === 5) return (
      <>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] items-center">
          <div>
            {kicker}
            <H1 className="mt-2" />
            <p className="mt-4 text-base lg:text-lg text-[#374151] leading-relaxed">{intro}</p>
            <a href="#question" className="mt-5 inline-flex items-center gap-2 min-h-[48px] px-6 rounded-lg font-semibold text-white bg-green-700 hover:bg-green-800">Poser ma question <ArrowRight className="w-4 h-4" /></a>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-md aspect-[4/3] bg-[#EFE9DD]">
            <img src="/categories/pneus-b.webp" alt="" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="mt-8 divide-y divide-[#E2DCD0] rounded-2xl bg-white shadow-md overflow-hidden">
          {doors.map((d) => go(d, "flex items-center gap-4 p-3 md:p-4 hover:bg-[#FAFAF8] transition-colors", (
            <>
              <span className="shrink-0 w-20 h-14 md:w-28 md:h-20 rounded-xl overflow-hidden bg-[#EFE9DD]"><img src={d.img} alt="" loading="lazy" className="w-full h-full object-cover" /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-base md:text-lg font-black uppercase tracking-tight" style={{ color: CARBON }}>{d.title}</span>
                <span className="block text-sm text-gray-600 leading-snug">{d.text}{countTxt(d) ? ` · ${countTxt(d)}` : ""}</span>
              </span>
              <ArrowRight className="w-5 h-5 shrink-0" style={{ color: GREEN }} />
            </>
          )))}
        </div>
      </>
    );
    // 0 · Actuel
    return (
      <>
        {kicker}
        <H1 className="mt-2" />
        <p className="mt-4 max-w-2xl text-base lg:text-lg text-[#374151] leading-relaxed">{intro}</p>
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {doors.map((d) => go(d, "block min-h-[44px] rounded-2xl bg-white p-4 shadow-md hover:shadow-xl transition-all duration-200", (
            <>
              <d.icon className="w-6 h-6" style={{ color: GREEN }} aria-hidden />
              <span className="mt-3 block text-lg font-black uppercase tracking-tight" style={{ color: CARBON }}>{d.title}</span>
              <span className="mt-1 block text-sm text-gray-600 leading-snug">{d.text}</span>
              {countTxt(d) ? <span className="mt-3 block text-sm font-bold" style={{ color: GREEN }}>{countTxt(d)}</span> : null}
            </>
          )))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F5F0E8", fontFamily: FONT }}>
      <SEO
        title="L'Atelier : guides, vidéos et questions trottinette"
        description="Pose ta question à un atelier de réparation de trottinettes électriques à Marseille. Guides d'achat, tutos d'entretien et vidéos rangées par modèle, avec les pièces compatibles."
        canonical={`${SITE}/atelier`}
        schema={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "L'Atelier — Pièces Trottinettes", url: `${SITE}/atelier` }}
      />
      <Header />
      <main className="flex-1 px-4 pt-24 pb-10 lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-5xl">
          {renderTop(variant)}

          <section id="question" className="mt-12 scroll-mt-24 grid gap-6 lg:grid-cols-[1fr_1.1fr] items-start">
            <div>
              <h2 className="text-2xl lg:text-3xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>Pose ta question</h2>
              <p className="mt-2 text-base text-[#374151] leading-relaxed">
                Taille de pneu, frein qui couine, chargeur qui clignote, pièce compatible ou pas : un réparateur te répond sous 48 h. La réponse est publiée pour aider les autres riders, ton email ne l'est jamais.
              </p>
            </div>
            <AskAtelierForm scooterSlug={trottSlug} scooterName={trottName} />
          </section>

          <section className="mt-12">
            <h2 className="text-2xl lg:text-3xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>Les dernières réponses de l'atelier</h2>
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
                <h2 className="text-2xl lg:text-3xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: CARBON }}>Les guides</h2>
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
