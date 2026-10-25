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
import RiderCard from "@/components/garage/RiderCard";
import RiderCardStory from "@/components/garage/story/RiderCardStory";
import RiderCardComments from "@/components/garage/story/RiderCardComments";
import { useCardComments } from "@/hooks/useRiderCardComments";
import { Panel, H2, ScooterStage, PartsShelf, SKIN, type GarageAtelierScooter } from "@/components/garage/atelier/GarageAtelierView";
import { useRiderCardData, useToggleCardLike } from "@/hooks/useRiderCardData";
import { useAuthContext } from "@/contexts/AuthContext";
import { getXPLevel } from "@/lib/xpLevels";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

const RiderPublicCard = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuthContext();
  const { data, isLoading } = useRiderCardData({ username });
  const { data: comments = [] } = useCardComments(data?.profile.id);
  const legacyCard = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("carte") === "0";
  const like = useToggleCardLike();
  const [i, setI] = useState(0);

  const machines = useMemo(() => {
    const list = (data?.machines ?? []).filter((m) => m.model);
    return [...list.filter((m) => m.is_featured), ...list.filter((m) => !m.is_featured)];
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
      <GarageBackground themeKey={data?.profile.active_theme_key ?? null} />
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
          <div className="mt-4 flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:items-start pb-8">
            <div className="flex flex-col gap-4 min-w-0">
              {/* Qui c'est */}
              <Panel pad="p-3 lg:p-4">
                <div className="flex items-center gap-3">
                  <RiderAvatar url={data.profile.avatar_url} name={name} size="md" />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-[18px] uppercase leading-[1.05]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Le garage de {name}</h1>
                    <p className="mt-1 text-sm font-semibold truncate" style={{ fontFamily: FONT, color: "#4B5563" }}>
                      Niveau {level.level} · {level.name} · {machines.length} machine{machines.length > 1 ? "s" : ""}
                    </p>
                    {data.profile.rider_location && (
                      <p className="mt-0.5 text-sm inline-flex items-center gap-1" style={{ fontFamily: FONT, color: "#6B7280" }}><MapPin className="w-3.5 h-3.5" />{data.profile.rider_location}</p>
                    )}
                  </div>
                </div>
                {data.profile.bio && <p className="mt-3 text-base" style={{ fontFamily: FONT, color: "#374151" }}>« {data.profile.bio} »</p>}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" disabled={isMe || like.isPending}
                    onClick={() => (user ? like.mutate({ ownerId: data.profile.id, liked: data.likedByMe }) : toast.info("Connecte-toi pour donner du respect"))}
                    className="min-h-[48px] inline-flex items-center justify-center gap-2 text-sm font-extrabold uppercase"
                    style={{ fontFamily: FONT, clipPath: cut(8), ...(data.likedByMe ? { background: GREEN, color: "#FFFFFF" } : { background: CARBON, color: "#FFFFFF" }) }}>
                    <Heart className="w-4 h-4" fill={data.likedByMe ? "currentColor" : "none"} /> Respect · {data.likes}
                  </button>
                  <button type="button" onClick={share} className="min-h-[48px] inline-flex items-center justify-center gap-2 text-sm font-extrabold uppercase"
                    style={{ fontFamily: FONT, clipPath: cut(8), background: "#FFFFFF", color: CARBON, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                    <Share2 className="w-4 h-4" /> Partager
                  </button>
                </div>
              </Panel>

              {/* Ses machines */}
              {stageScooter && (
                <ScooterStage scooter={stageScooter} scooterCount={machines.length} currentIndex={i} label="Sa machine"
                  onPrev={() => setI((x) => Math.max(0, x - 1))} onNext={() => setI((x) => Math.min(machines.length - 1, x + 1))} />
              )}

              {/* Ce qu'il a monté dessus */}
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

              {/* Les pièces qui vont sur SA machine : le visiteur peut monter la même chose */}
              {stageScooter && <PartsShelf scooter={stageScooter} title={`Les pièces pour sa ${stageScooter.scooter_model.name}`} />}
            </div>

            <aside className="order-first lg:order-none flex flex-col gap-4 min-w-0 items-center lg:items-stretch">
              {legacyCard ? (
                <Panel>
                  <H2>Sa carte rider</H2>
                  <div className="mt-3 flex justify-center"><RiderCard mode="public" data={data} /></div>
                </Panel>
              ) : (
                <>
                  {/* 25/10 : carte Rider Story (choix de Nolan) + ses commentaires */}
                  <RiderCardStory data={data} commentCount={comments.length} onOpenComments={() => document.getElementById("carte-commentaires")?.scrollIntoView({ behavior: "smooth", block: "start" })} />
                  <div className="w-full max-w-[360px] lg:max-w-none"><RiderCardComments id="carte-commentaires" ownerId={data.profile.id} ownerName={name} /></div>
                </>
              )}
              {!isMe && (
                <section className="p-5" style={{ background: CARBON, clipPath: cut(14) }}>
                  <p className="text-[20px] uppercase leading-tight text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em" }}>
                    Toi aussi, <span style={{ color: "#8FBF9C" }}>montre ta machine.</span>
                  </p>
                  <p className="mt-2 text-base" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.75)" }}>Ton garage gratuit, ton wallpaper, tes pièces compatibles. +50 XP à l'inscription.</p>
                  <Link to="/register" className="mt-4 flex items-center justify-between min-h-[52px] px-5 text-[15px] font-extrabold uppercase" style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(10), fontFamily: FONT }}>
                    Créer mon garage <ArrowRight className="w-5 h-5" />
                  </Link>
                </section>
              )}
            </aside>
          </div>
        )}
      </main>
      <div className="relative z-10"><Footer /></div>
    </div>
  );
};

export default RiderPublicCard;
