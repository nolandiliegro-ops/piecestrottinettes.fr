/**
 * /rider/:username — le garage public d'un rider (18/10/2026, « go garage » de Nolan).
 * C'est le lien que chaque rider met dans sa bio TikTok : SON wallpaper derrière, SES machines en grand,
 * ce qu'il a monté dessus, les pièces qui vont sur chaque machine (le visiteur peut acheter la même chose),
 * sa carte Rider, le « respect » (like) et un bouton partager. Tout est lu sur les profils publics
 * (règles d'accès déjà en place) : aucune écriture en base hors le like, qui existait déjà.
 */
import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ArrowRight, Heart, MapPin, Share2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GarageBackground from "@/components/garage/GarageBackground";
import RiderAvatar from "@/components/garage/RiderAvatar";
import RiderCardStory, { cardRows } from "@/components/garage/story/RiderCardStory";
import RiderCardComments from "@/components/garage/story/RiderCardComments";
import { useCardComments } from "@/hooks/useRiderCardComments";
import { Panel, H2, StandHeading, PartsShelf, SKIN, ArrowBtn, Kicker, Title, Chips, stageSpecs, type GarageAtelierScooter } from "@/components/garage/atelier/GarageAtelierView";
import StandTrott, { StandSpace } from "@/components/garage/v3/StandTrott";
import { useRiderCardData, useToggleCardLike } from "@/hooks/useRiderCardData";
import { useAuthContext } from "@/contexts/AuthContext";
import { getXPLevel } from "@/lib/xpLevels";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

/* 26/10 (Nolan, sur ordinateur : « on voit deux fois la même trottinette. Le nom, je préfère quand il est en bas…
   il faut harmoniser ») : 5 vitrines derrière `?vitrine=1..5` (gardé pour l'onglet) ; 0 = la page d'avant.
   1 Littéral · 2 Plaque · 3 Une seule carte · 4 Rangée de trotts · 5 Nom au sol.
   Choix de Nolan (26/10) : 6 = la n°1 avec le nom INCRUSTÉ au sol (perspective couchée), et la scène remontée sur
   téléphone pour que la trott et son nom tiennent au-dessus de la barre du bas. */
const VITRINE_DEFAUT = 6;
const readVitrine = (): number => {
  try {
    const q = new URLSearchParams(window.location.search).get("vitrine");
    if (q !== null && /^[0-6]$/.test(q)) { window.sessionStorage.setItem("pt-vitrine", q); return Number(q); }
    const v = window.sessionStorage.getItem("pt-vitrine");
    return v && /^[0-6]$/.test(v) ? Number(v) : VITRINE_DEFAUT;
  } catch { return VITRINE_DEFAUT; }
};

const RiderPublicCard = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuthContext();
  const { data, isLoading } = useRiderCardData({ username });
  const { data: comments = [] } = useCardComments(data?.profile.id);
  const like = useToggleCardLike();
  const [i, setI] = useState(0);
  const [vitrine] = useState(readVitrine);

  // 25/10 : même ordre que la carte (ses 5 « à moi », ses 5 « je kiffe », puis le reste) — la scène ouvre sur la trott de la carte.
  const machines = useMemo(() => {
    const list = (data?.machines ?? []).filter((m) => m.model);
    const { mine, liked } = cardRows(list);
    const onCard = [...mine, ...liked];
    const first = mine.find((m) => m.is_featured) ?? onCard[0];
    const ordered = [...onCard, ...list.filter((m) => !onCard.includes(m))];
    return first ? [first, ...ordered.filter((m) => m !== first)] : ordered;
  }, [data]);
  const cur = machines[Math.min(i, Math.max(0, machines.length - 1))];
  const name = data?.profile.display_name ?? username ?? "Rider";
  const isMe = !!user && data?.profile.id === user.id;

  const stageScooter: GarageAtelierScooter | null = cur?.model
    ? {
        id: cur.id,
        nickname: cur.nickname,
        custom_photo_url: cur.custom_photo_url,
        scooter_model: { id: cur.model.id, name: cur.model.name, brand: cur.model.brand, image_url: cur.model.image_url, voltage: cur.model.voltage, power_watts: cur.model.power_watts },
      }
    : null;
  const mods = cur ? data?.modsByMachine[cur.id] ?? [] : [];
  const stageHeading = stageScooter ? (
    <StandHeading scooter={stageScooter} scooterCount={machines.length} currentIndex={i} label={cur?.is_owned === false ? "Il kiffe" : "Sa machine"}
      onPrev={() => setI((x) => Math.max(0, x - 1))} onNext={() => setI((x) => Math.min(machines.length - 1, x + 1))} />
  ) : null;

  // Vitrines : la carte n'a plus sa propre grande trott (« bare », comme dans ton Garage) sauf en 3 ; le nom passe sous l'estrade.
  const carteNue = vitrine === 1 || vitrine === 2 || vitrine === 4 || vitrine === 5 || vitrine === 6;
  const auSol = vitrine === 6;
  const avecEstrade = vitrine !== 3;
  const nomEnHaut = vitrine === 0;
  const prev = () => setI((x) => Math.max(0, x - 1));
  const next = () => setI((x) => Math.min(machines.length - 1, x + 1));
  const multi = machines.length > 1;
  const label = cur?.is_owned === false ? "Il kiffe" : "Sa machine";
  const nomEnBas = !stageScooter ? null : vitrine === 1 ? stageHeading
    : vitrine === 2 ? (
      <div className="flex items-center justify-center gap-3">
        {multi && <ArrowBtn dir="prev" onClick={prev} disabled={i <= 0} />}
        <div className="min-w-0 px-4 py-3 text-center" style={{ background: "rgba(26,26,26,0.86)", clipPath: cut(12) }}>
          <Kicker label={label} multi={multi} i={i} n={machines.length} light />
          <div className="mt-1"><Title m={stageScooter.scooter_model} nickname={stageScooter.nickname} light size="text-[22px] lg:text-[30px]" /></div>
          <div className="flex justify-center"><Chips specs={stageSpecs(stageScooter.scooter_model)} light /></div>
        </div>
        {multi && <ArrowBtn dir="next" onClick={next} disabled={i >= machines.length - 1} />}
      </div>
    ) : vitrine === 4 ? (
      <div className="grid gap-3">
        <div><Kicker label={label} multi={multi} i={i} n={machines.length} light /><div className="mt-1"><Title m={stageScooter.scooter_model} nickname={stageScooter.nickname} light size="text-[24px] lg:text-[34px]" /></div></div>
        {multi && (
          <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {machines.map((m, k) => (
              <li key={m.id} className="shrink-0">
                <button type="button" onClick={() => setI(k)} aria-pressed={k === i} aria-label={m.model?.name ?? "trottinette"}
                  className="w-[64px] h-[64px] inline-flex items-center justify-center"
                  style={{ background: m.is_owned === false ? "#F1D9CC" : "#FFFFFF", clipPath: cut(8), boxShadow: k === i ? `inset 0 0 0 3px ${GREEN}` : undefined }}>
                  {m.model?.image_url && <img src={m.model.image_url} alt="" className="max-w-[86%] max-h-[86%] object-contain" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    ) : vitrine === 5 ? (
      <div className="text-center grid justify-items-center gap-2">
        <Kicker label={label} multi={multi} i={i} n={machines.length} light />
        <div className="flex items-center justify-center gap-3 w-full">
          {multi && <ArrowBtn dir="prev" onClick={prev} disabled={i <= 0} size="w-10 h-10" />}
          <p className="min-w-0 uppercase leading-[0.9] text-white text-[34px] lg:text-[64px]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.04em", textShadow: "0 4px 24px rgba(0,0,0,0.6)" }}>{stageScooter.scooter_model.name}</p>
          {multi && <ArrowBtn dir="next" onClick={next} disabled={i >= machines.length - 1} size="w-10 h-10" />}
        </div>
        <Chips specs={stageSpecs(stageScooter.scooter_model)} light />
      </div>
    ) : null;
  // 6 · Nom au sol : en haut de l'espace libre, seulement le repère (« Sa machine · 1/15 »), les chiffres et les flèches.
  const reperes = stageScooter ? (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><Kicker label={label} multi={multi} i={i} n={machines.length} light /><Chips specs={stageSpecs(stageScooter.scooter_model)} light /></div>
      {multi && <div className="flex gap-2 shrink-0"><ArrowBtn dir="prev" onClick={prev} disabled={i <= 0} /><ArrowBtn dir="next" onClick={next} disabled={i >= machines.length - 1} /></div>}
    </div>
  ) : null;

  const share = async () => {
    const url = `${window.location.origin}/rider/${data?.profile.username ?? username}`;
    const nav = navigator as Navigator & { share?: (d: { title?: string; url?: string }) => Promise<void> };
    try {
      if (nav.share) await nav.share({ title: `Le garage de ${name}`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien du garage copié");
      }
    } catch {
      /* partage annulé */
    }
  };

  const level = getXPLevel(data?.profile.performance_points ?? 0);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden pb-24 md:pb-0" data-gatelier>
      <style>{SKIN}</style>
      <GarageBackground themeKey={data?.profile.active_theme_key ?? null} remonte={auSol} />
      <Helmet>
        <title>{`Le garage de ${name} | Pièces Trottinettes`}</title>
        <meta name="description" content={`Les trottinettes de ${name}, ce qu'il a monté dessus et les pièces compatibles.`} />
        <meta property="og:title" content={`Le garage de ${name}`} />
        <meta property="og:description" content={`${machines.length} machine${machines.length > 1 ? "s" : ""} · les pièces qui vont dessus.`} />
        <meta property="og:type" content="profile" />
        {username && <link rel="canonical" href={`https://piecestrottinettes.fr/rider/${encodeURIComponent(username)}`} />}
        {/* Garage vide ou introuvable : la page répond 200 → noindex (audit SEO 24/10). */}
        {!isLoading && (!data || machines.length === 0) && <meta name="robots" content="noindex, nofollow" />}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <Header />

      <main className="relative z-10 flex-1 pt-20 lg:pt-24 px-4 lg:px-6 max-w-[1280px] mx-auto w-full">
        {isLoading ? (
          <div className="mt-6 h-[420px] animate-pulse" style={{ background: "rgba(250,250,248,0.6)", clipPath: cut(14) }} />
        ) : !data || machines.length === 0 ? (
          <Panel className="mt-6">
            <H2>Garage introuvable</H2>
            <p className="mt-2 text-base" style={{ fontFamily: FONT, color: "#4B5563" }}>Ce garage n'existe pas, est privé, ou n'a pas encore de trottinette.</p>
            <Link to="/register" className="mt-4 inline-flex items-center gap-2 min-h-[48px] px-5 text-sm font-extrabold uppercase text-white" style={{ background: CARBON, clipPath: cut(8), fontFamily: FONT }}>
              Créer mon garage <ArrowRight className="w-4 h-4" />
            </Link>
          </Panel>
        ) : (
          <div className="pb-10">
            {/* 25/10 (garage v3) : la page publique reprend « Ma carte » — le titre sur le wallpaper, la carte Story
                en premier, ses commentaires, puis ses machines et les pièces qui vont dessus. */}
            {/* 26/10 (Nolan : « il faudrait qu'on voie la tête, le logo du profil ») : l'avatar du rider à côté du titre,
                au même dessin que sur sa carte (coin coupé, fond blanc). */}
            <header className="mt-2 mb-5 flex items-center gap-3 lg:gap-4">
              {data.profile.avatar_url ? (
                <img src={data.profile.avatar_url} alt={`Photo de ${name}`} className="w-[68px] h-[68px] lg:w-[92px] lg:h-[92px] shrink-0 object-cover bg-white"
                  style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }} />
              ) : (
                <span className="w-[68px] h-[68px] lg:w-[92px] lg:h-[92px] shrink-0 inline-flex items-center justify-center bg-white text-[26px]"
                  style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: "#1A1A1A", clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>{name.slice(0, 1).toUpperCase()}</span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: "#8FBF9C", textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
                  Garage public · {level.name}{data.profile.rider_location ? ` · ${data.profile.rider_location}` : ""}
                </p>
                <h1 className="mt-1 text-[30px] lg:text-[48px] uppercase leading-[0.95] text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", textShadow: "0 2px 18px rgba(0,0,0,0.45)" }}>
                  Le garage de {name}
                </h1>
              </div>
            </header>

              {/* 25/10 soir (Nolan : « au sol… vraiment sur l'estrade… qu'elle flotte ») : sa trott posée sur l'estrade de SON
                  wallpaper, toujours au même endroit. Téléphone : la scène d'abord, la carte juste en dessous. */}
              {stageScooter && avecEstrade && (
                <>
                  <StandTrott src={stageScooter.scooter_model.image_url || stageScooter.custom_photo_url} alt={stageScooter.scooter_model.name} remonte={auSol} sol={auSol ? stageScooter.scooter_model.name : undefined} />
                  <StandSpace className="lg:hidden mb-4" remonte={auSol} sol={auSol}>{nomEnHaut ? stageHeading : auSol ? reperes : null}</StandSpace>
                  {!nomEnHaut && !auSol && <div className="lg:hidden mb-5">{nomEnBas}</div>}
                </>
              )}
              {/* grid-cols-[minmax(0,1fr)] : sans lui, la frise de pièces élargissait la colonne à 2 165 px sur téléphone — trott hors écran (25/10). */}
              <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-8 items-start">
                <div className="grid gap-4 justify-items-center lg:justify-items-stretch lg:sticky lg:top-24">
                  <RiderCardStory data={data} bare={carteNue} selectedId={cur?.id ?? null} onSelect={(m) => { const k = machines.findIndex((x) => x.id === m.id); if (k >= 0) setI(k); }} commentCount={comments.length} onOpenComments={() => document.getElementById("carte-commentaires")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
                  <div className="w-full max-w-[360px]"><RiderCardComments id="carte-commentaires" ownerId={data.profile.id} ownerName={name} /></div>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)] gap-4 min-w-0">
                  {stageScooter && avecEstrade && <StandSpace className="hidden lg:block" remonte={auSol} sol={auSol}>{nomEnHaut ? stageHeading : auSol ? reperes : null}</StandSpace>}
                  {stageScooter && avecEstrade && !nomEnHaut && !auSol && <div className="hidden lg:block">{nomEnBas}</div>}
                  {mods.length > 0 && (
                    <Panel>
                      <H2>Ce qu'il a monté dessus</H2>
                      <ul className="mt-2 flex flex-col">
                        {mods.slice(0, 5).map((mo, k) => (
                          <li key={mo.id} className="flex items-center gap-3 py-2.5" style={{ borderTop: k ? `1px solid ${LINE}` : "none" }}>
                            <span className="w-1.5 h-8 shrink-0" style={{ background: GREEN }} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[15px] font-semibold truncate" style={{ fontFamily: FONT, color: CARBON }}>{mo.part?.name ?? "Modification"}</span>
                              <span className="block text-sm" style={{ fontFamily: FONT, color: "#6B7280" }}>{mo.part?.category?.name ? `${mo.part.category.name} · ` : ""}{formatDistanceToNow(new Date(mo.installed_at), { addSuffix: true, locale: fr })}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Panel>
                  )}
                  {stageScooter && <PartsShelf scooter={stageScooter} title={`Les pièces pour sa ${stageScooter.scooter_model.name}`} />}
                  {!isMe ? (
                    <section className="p-5" style={{ background: CARBON, clipPath: cut(14) }}>
                      <p className="text-[20px] uppercase leading-tight text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em" }}>
                        Toi aussi, <span style={{ color: "#8FBF9C" }}>fais ta carte.</span>
                      </p>
                      <p className="mt-2 text-base" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.75)" }}>Tes trotts, tes coups de cœur, ton wallpaper. Gratuit.</p>
                      <Link to={user ? "/garage" : "/register"} className="mt-4 flex items-center justify-between min-h-[52px] px-5 text-[15px] font-extrabold uppercase" style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(10), fontFamily: FONT }}>
                        {user ? "Ouvrir mon garage" : "Créer ma carte · gratuit"} <ArrowRight className="w-5 h-5" />
                      </Link>
                    </section>
                  ) : (
                    <Link to="/garage" className="flex items-center justify-between min-h-[52px] px-5 text-[15px] font-extrabold uppercase" style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(10), fontFamily: FONT }}>
                      C'est ton garage : le modifier <ArrowRight className="w-5 h-5" />
                    </Link>
                  )}
                </div>
              </div>
          </div>
        )}
      </main>
      <div className="relative z-10"><Footer /></div>
    </div>
  );
};

export default RiderPublicCard;
