/**
 * Accueil (25/10/2026, choix de Nolan) : la carte Rider Story « de la semaine » remplace le bloc vert
 * « Créer ma carte Rider ». Le wallpaper du rider en fond, le texte à gauche, la carte à droite ; un bouton blanc.
 * Pas de défilement automatique : on ne change pas la carte pendant qu'on la regarde. Ancien bloc : ?carte=0.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import RiderCardStory from "@/components/garage/story/RiderCardStory";
import { useRiderCardData } from "@/hooks/useRiderCardData";
import { useCardComments } from "@/hooks/useRiderCardComments";
import type { RiderBundle } from "../GarageOfTheWeekSection";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const SOFT = "#8FBF9C";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

const HomeRiderCard = ({ riders, isAuthenticated }: { riders: RiderBundle[]; isAuthenticated: boolean }) => {
  const [i, setI] = useState(0);
  const rider = riders[Math.min(i, Math.max(0, riders.length - 1))];
  const { data } = useRiderCardData({ username: rider?.username ?? undefined });
  const { data: comments = [] } = useCardComments(data?.profile.id);
  const many = riders.length > 1;
  const nav = "w-11 h-11 inline-flex items-center justify-center bg-white";

  return (
    <section aria-labelledby="garage-of-the-week-title" className="relative overflow-hidden" data-home-rider-card>
      <div aria-hidden className="absolute inset-0" style={{ background: CARBON }}>
        {(data?.wallpaper_url || rider?.wallpaper_url) && <img src={data?.wallpaper_url || rider?.wallpaper_url || ""} alt="" loading="lazy" className="w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14 items-center">
        <div className="min-w-0 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.16em]" style={{ fontFamily: FONT, color: SOFT }}>La carte de la semaine</p>
          <h2 id="garage-of-the-week-title" className="mt-2 text-[34px] sm:text-6xl uppercase leading-[0.95]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em" }}>
            Ton garage<br />en une carte.
          </h2>
          <p className="mt-4 text-base sm:text-lg max-w-lg" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.88)" }}>
            Tes trotts, tes coups de cœur, ton décor. Partage-la en story, les riders la commentent.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to={isAuthenticated ? "/garage" : "/register"} className="inline-flex items-center gap-3 min-h-[56px] px-5 text-[15px] font-extrabold uppercase" style={{ fontFamily: FONT, background: "#FFFFFF", color: CARBON, clipPath: cut(10) }}>
              {isAuthenticated ? "Voir ma carte" : "Créer ma carte · gratuit"} <ArrowRight className="w-5 h-5" />
            </Link>
            {rider?.username && (
              <Link to={`/rider/${rider.username}`} className="inline-flex items-center min-h-[56px] px-2 text-[15px] font-bold underline underline-offset-4" style={{ fontFamily: FONT, color: "#FFFFFF" }}>
                Le garage de {rider.display_name}
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 min-w-0">
          {data ? <RiderCardStory data={data} commentCount={comments.length} /> : <div className="w-full max-w-[360px] h-[640px] animate-pulse" style={{ background: "rgba(250,250,248,0.12)" }} />}
          {many && (
            <div className="flex items-center gap-3">
              <button type="button" className={nav} style={{ clipPath: cut(6), color: CARBON }} aria-label="Carte précédente" onClick={() => setI((x) => (x - 1 + riders.length) % riders.length)}><ChevronLeft className="w-5 h-5" /></button>
              <span className="text-sm font-bold text-white" style={{ fontFamily: FONT }}>{i + 1} / {riders.length}</span>
              <button type="button" className={nav} style={{ clipPath: cut(6), color: CARBON }} aria-label="Carte suivante" onClick={() => setI((x) => (x + 1) % riders.length)}><ChevronRight className="w-5 h-5" /></button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeRiderCard;
