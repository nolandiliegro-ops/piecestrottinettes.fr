/**
 * Bloc « Garage » de l'accueil, remis à jour sur le NOUVEAU garage (19/10/2026, retour Nolan : « il n'est plus à
 * jour avec le garage »). Mêmes briques que /garage et /rider/:username : le wallpaper du rider en fond, sa trott
 * qui sort de la plaque (deux tons pierre, comme le carrousel d'accueil), sa carte d'identité, et le lien vers SON
 * garage public. Retiré : « Tutos sur mesure » (aucune vidéo encore), « Points fidélité · Offres membres · Bientôt ».
 * Chiffres réels : 19 wallpapers dont 14 gratuits (base garage_themes au 19/10).
 */
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import RiderAvatar from "@/components/garage/RiderAvatar";
import { getXPLevel } from "@/lib/xpLevels";
import type { RiderBundle, RiderScooter } from "../GarageOfTheWeekSection";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SOFT = "#8FBF9C";
const PAPER = "#FAFAF8";
const STONE = "#ECE8E0";
const LINE = "#E2DCD0";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

interface Props {
  riders: RiderBundle[];
  riderIndex: number;
  scooterIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToRider: (i: number) => void;
  onGoToScooter: (i: number) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const PERKS: [string, string][] = [
  ["Ta trott en vitrine", "Son entretien, tes upgrades."],
  ["19 wallpapers", "Dont 14 gratuits."],
  ["Les bonnes pièces", "Que ce qui va sur TA trott."],
  ["-20 % au lancement", "Carte Rider + code perso, max 30 €."],
];

const photo = (s?: RiderScooter) => (s ? s.custom_photo_url || s.scooter_model.image_url : null);

const GarageVitrine = ({ riders, riderIndex, scooterIndex, onPrev, onNext, onGoToRider, onGoToScooter, isLoading, isAuthenticated }: Props) => {
  const reduce = useReducedMotion();
  const rider = riders[riderIndex];
  const scooter = rider?.scooters[Math.min(scooterIndex, Math.max(0, (rider?.scooters.length ?? 1) - 1))];
  const m = scooter?.scooter_model;
  const level = getXPLevel(rider?.performance_points ?? 0);
  const specs = m ? ([m.voltage && `${m.voltage} V`, m.amperage && `${m.amperage} Ah`, m.power_watts && `${m.power_watts} W`].filter(Boolean) as string[]) : [];

  return (
    <section aria-labelledby="garage-of-the-week-title" className="relative overflow-hidden" data-garage-vitrine>
      {/* Le wallpaper du rider, comme dans son garage */}
      <div aria-hidden className="absolute inset-0" style={{ background: CARBON }}>
        {rider?.wallpaper_url && <img src={rider.wallpaper_url} alt="" loading="lazy" className="w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,26,26,0.55) 0%, rgba(26,26,26,0.35) 45%, rgba(26,26,26,0.75) 100%)" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <p className="text-sm font-bold uppercase tracking-[0.16em]" style={{ fontFamily: FONT, color: SOFT }}>Espace rider · gratuit</p>
        <h2 id="garage-of-the-week-title" className="mt-2 text-[30px] sm:text-5xl uppercase leading-[0.95]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: "#FFFFFF" }}>
          Ton garage. <span style={{ color: SOFT }}>Ta machine.</span>
        </h2>
        <p className="mt-3 text-base max-w-xl" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.82)" }}>
          Comme {rider ? <b>{rider.display_name}</b> : "nos riders"} : ta trott en vitrine, ton décor, et les pièces qui vont dessus.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-6 lg:items-end">
          {/* Sa machine : la trott sort de la plaque */}
          <div className="relative pt-20 lg:pt-24 min-w-0">
            {isLoading || !m ? (
              <div className="h-[380px] animate-pulse" style={{ background: "rgba(250,250,248,0.15)", clipPath: cut(22) }} />
            ) : (
              <>
                <div className="relative" style={{ clipPath: cut(22), background: CARBON }}>
                  <div aria-hidden className="absolute inset-x-0 top-0 h-[200px] lg:h-[280px]" style={{ background: STONE }} />
                  <div className="relative px-4 pb-4 pt-[214px] lg:px-6 lg:pb-6 lg:pt-[296px]">
                    <p className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: SOFT }}>
                      Sa machine{rider.scooters.length > 1 ? ` · ${scooterIndex + 1}/${rider.scooters.length}` : ""}
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold uppercase" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.65)" }}>{m.brand}</p>
                        <p className="text-[24px] lg:text-[34px] uppercase leading-[0.98] line-clamp-2" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: "#FFFFFF" }}>{m.name}</p>
                      </div>
                      {rider.scooters.length > 1 && (
                        <div className="flex gap-2 shrink-0">
                          {[-1, 1].map((d) => (
                            <button key={d} type="button" aria-label={d < 0 ? "Trottinette précédente" : "Trottinette suivante"}
                              onClick={() => onGoToScooter((scooterIndex + d + rider.scooters.length) % rider.scooters.length)}
                              className="w-11 h-11 inline-flex items-center justify-center" style={{ background: "#FFFFFF", color: CARBON, clipPath: cut(7) }}>
                              {d < 0 ? <ChevronLeft className="w-5 h-5" strokeWidth={2.6} /> : <ChevronRight className="w-5 h-5" strokeWidth={2.6} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {specs.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {specs.map((t) => <span key={t} className="px-2.5 py-1 text-sm font-bold" style={{ fontFamily: FONT, background: "#2E2E2E", color: "#FFFFFF", clipPath: cut(6) }}>{t}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[290px] lg:h-[380px] flex items-end justify-center">
                  <AnimatePresence mode="wait">
                    <motion.img key={scooter.id} src={photo(scooter) ?? undefined} alt={m.name} loading="lazy"
                      initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.35 }}
                      className="h-full w-auto max-w-[92%] object-contain" style={{ filter: "drop-shadow(0 18px 16px rgba(0,0,0,0.22))" }} />
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Qui c'est + ce que tu gagnes */}
          <div className="flex flex-col gap-4 min-w-0">
            {rider && (
              <div className="p-4 lg:p-5" style={{ background: PAPER, clipPath: cut(14) }}>
                <div className="flex items-center gap-3">
                  <RiderAvatar url={rider.avatar_url} name={rider.display_name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] uppercase leading-tight truncate" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{rider.display_name}</p>
                    <p className="text-sm font-semibold" style={{ fontFamily: FONT, color: "#4B5563" }}>
                      Niveau {level.level} · {level.name}{rider.rider_location ? <> · <MapPin className="inline w-3.5 h-3.5 -mt-0.5" /> {rider.rider_location}</> : null}
                    </p>
                  </div>
                  {riders.length > 1 && (
                    <div className="flex gap-1.5 shrink-0">
                      <button type="button" onClick={onPrev} aria-label="Rider précédent" className="w-11 h-11 inline-flex items-center justify-center" style={{ background: "#FFFFFF", color: CARBON, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(7) }}><ChevronLeft className="w-5 h-5" /></button>
                      <button type="button" onClick={onNext} aria-label="Rider suivant" className="w-11 h-11 inline-flex items-center justify-center" style={{ background: "#FFFFFF", color: CARBON, boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: cut(7) }}><ChevronRight className="w-5 h-5" /></button>
                    </div>
                  )}
                </div>
                {rider.bio && <p className="mt-3 text-base line-clamp-2" style={{ fontFamily: FONT, color: "#374151" }}>« {rider.bio} »</p>}
                {riders.length > 1 && (
                  <div className="mt-3 flex gap-1.5" role="tablist" aria-label="Riders en vitrine">
                    {riders.map((r, i) => (
                      <button key={r.id} type="button" role="tab" aria-selected={i === riderIndex} aria-label={r.display_name} onClick={() => onGoToRider(i)}
                        className="h-11 flex items-center"><span className="block h-1.5 transition-all" style={{ width: i === riderIndex ? 28 : 12, background: i === riderIndex ? GREEN : LINE }} /></button>
                    ))}
                  </div>
                )}
                {rider.username && (
                  <Link to={`/rider/${rider.username}`} className="mt-2 inline-flex items-center gap-2 min-h-[44px] text-sm font-extrabold uppercase tracking-wide underline underline-offset-4" style={{ fontFamily: FONT, color: CARBON }}>
                    Voir le garage de {rider.display_name} <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}

            <div className="p-4 lg:p-5" style={{ background: CARBON, clipPath: cut(14) }}>
              <ul className="flex flex-col">
                {PERKS.map(([t, d], k) => (
                  <li key={t} className="py-2.5" style={{ borderTop: k ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                    <p className="text-[15px] font-extrabold" style={{ fontFamily: FONT, color: "#FFFFFF" }}>{t}</p>
                    <p className="text-sm" style={{ fontFamily: FONT, color: "rgba(255,255,255,0.7)" }}>{d}</p>
                  </li>
                ))}
              </ul>
              <Link to={isAuthenticated ? "/garage" : "/register"} className="mt-3 flex items-center justify-between min-h-[52px] px-5 text-[15px] font-extrabold uppercase"
                style={{ fontFamily: FONT, background: "#FFFFFF", color: CARBON, clipPath: cut(10) }}>
                {isAuthenticated ? "Ouvrir mon garage" : <span>Créer mon garage <span style={{ color: GREEN }}>+50 XP</span></span>} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GarageVitrine;
