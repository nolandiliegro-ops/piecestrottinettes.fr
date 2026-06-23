import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bike, ChevronLeft, ChevronRight } from "lucide-react";
import { getBrandColors } from "@/contexts/ScooterContext";
import { getAllImages } from "@/lib/entityImage";
import type { ScooterDetail } from "@/hooks/useScooterDetail";
import type { ShowroomCarouselScooter } from "@/hooks/useShowroomData";
import ShowroomActionButtons from "@/components/showroom/ShowroomActionButtons";

interface ShowroomHeroProps {
  scooter: ScooterDetail;
  allScooters: ShowroomCarouselScooter[];
  prevSlug: string | null;
  nextSlug: string | null;
}

const UNBOUNDED = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";

const ShowroomHero = ({ scooter, allScooters, prevSlug, nextSlug }: ShowroomHeroProps) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const brand = getBrandColors(scooter.brand?.name);
  const accent = brand.accent;
  const brandName = scooter.brand?.name ?? "";

  // Galerie multi-photos du modèle courant
  const photos = getAllImages(scooter.images, scooter.image_url);
  const [photoIdx, setPhotoIdx] = useState(0);
  // Reset la photo active quand on change de modèle
  useEffect(() => {
    setPhotoIdx(0);
  }, [scooter.slug]);
  const currentPhoto = photos[photoIdx]?.url ?? null;
  const hasGallery = photos.length > 1;

  const prevScooter = prevSlug ? allScooters.find((s) => s.slug === prevSlug) : undefined;
  const nextScooter = nextSlug ? allScooters.find((s) => s.slug === nextSlug) : undefined;
  const hasNav = allScooters.length > 1 && !!prevSlug && !!nextSlug && prevSlug !== nextSlug;

  const goTo = (target: string | null) => {
    if (!target || target === scooter.slug) return;
    navigate(`/scooter/${target}`, { replace: true });
  };

  // Horizontal swipe (mobile) — only when clearly horizontal, to avoid hijacking vertical scroll.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      goTo(dx < 0 ? nextSlug : prevSlug);
    }
  };

  // Chips specs (rendus seulement si valeur présente)
  const chips = [
    { label: "Puissance", value: scooter.power_watts, unit: "W" },
    { label: "Vitesse", value: scooter.max_speed_kmh, unit: "km/h" },
    { label: "Autonomie", value: scooter.range_km, unit: "km" },
  ].filter((c) => c.value != null);

  const brandInitial = brandName ? brandName.charAt(0).toUpperCase() : "";

  return (
    <section
      className="relative overflow-hidden px-4 pt-24 pb-12 lg:pt-32 lg:pb-16"
      style={{
        background: `radial-gradient(120% 80% at 50% 0%, ${accent}22 0%, #FAFAF8 60%)`,
      }}
    >
      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Carousel row */}
        <div
          className="relative flex items-center justify-center select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Watermark — nom du modèle en filigrane derrière la trott */}
          <div
            aria-hidden
            className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden"
          >
            <span
              className="whitespace-nowrap leading-none select-none"
              style={{
                fontFamily: UNBOUNDED,
                fontWeight: 900,
                fontSize: "clamp(64px, 18vw, 220px)",
                letterSpacing: "-0.04em",
                color: accent,
                opacity: 0.07,
                textTransform: "uppercase",
              }}
            >
              {scooter.name}
            </span>
          </div>

          {/* Adjacent previews (desktop only) — fantômes prev/next */}
          {hasNav && prevScooter && (
            <button
              type="button"
              onClick={() => goTo(prevSlug)}
              aria-label={`Voir ${prevScooter.name}`}
              className="absolute left-0 z-[1] hidden lg:block"
              style={{ opacity: 0.28, transform: "scale(0.62)" }}
            >
              {prevScooter.image_url ? (
                <img src={prevScooter.image_url} alt="" className="h-[240px] w-auto object-contain" loading="lazy" />
              ) : (
                <Bike className="w-28 h-28" style={{ color: "rgba(107,114,128,0.4)" }} strokeWidth={1} />
              )}
            </button>
          )}
          {hasNav && nextScooter && (
            <button
              type="button"
              onClick={() => goTo(nextSlug)}
              aria-label={`Voir ${nextScooter.name}`}
              className="absolute right-0 z-[1] hidden lg:block"
              style={{ opacity: 0.28, transform: "scale(0.62)" }}
            >
              {nextScooter.image_url ? (
                <img src={nextScooter.image_url} alt="" className="h-[240px] w-auto object-contain" loading="lazy" />
              ) : (
                <Bike className="w-28 h-28" style={{ color: "rgba(107,114,128,0.4)" }} strokeWidth={1} />
              )}
            </button>
          )}

          {/* Center image (galerie multi-photos) — AGRANDIE */}
          <div
            className="relative z-10 aspect-[4/3] flex items-center justify-center p-2"
            style={{ width: "clamp(300px, 46vw, 560px)" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${scooter.slug}-${photoIdx}`}
                initial={reduceMotion ? false : { opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full flex items-center justify-center"
              >
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={photos[photoIdx]?.alt || scooter.name}
                    className="max-h-full max-w-full object-contain"
                    style={{ filter: "drop-shadow(0 26px 34px rgba(26,26,26,0.28))" }}
                  />
                ) : (
                  <Bike className="w-32 h-32" style={{ color: `${accent}66` }} strokeWidth={1} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Arrows (navigation entre modèles) */}
          {hasNav && (
            <>
              <button
                type="button"
                onClick={() => goTo(prevSlug)}
                aria-label="Trottinette précédente"
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white shadow-lg hover:shadow-xl transition-all border border-gray-100"
                style={{ color: "#1A1A1A" }}
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => goTo(nextSlug)}
                aria-label="Trottinette suivante"
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white shadow-lg hover:shadow-xl transition-all border border-gray-100"
                style={{ color: "#1A1A1A" }}
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails — photos du modèle courant */}
        {hasGallery && (
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            {photos.map((img, idx) => (
              <button
                key={`${img.url}-${idx}`}
                type="button"
                onClick={() => setPhotoIdx(idx)}
                aria-label={`Voir photo ${idx + 1}`}
                className="w-14 h-14 rounded-lg overflow-hidden border-2 transition-all bg-white/60"
                style={{
                  borderColor: idx === photoIdx ? accent : "rgba(26,26,26,0.12)",
                  opacity: idx === photoIdx ? 1 : 0.6,
                  transform: idx === photoIdx ? "scale(1.05)" : "none",
                }}
              >
                <img
                  src={img.url}
                  alt={img.alt || `${scooter.name} ${idx + 1}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 lg:mt-10 text-center lg:text-left">
          {/* Lockup marque : logo réel si dispo, sinon pastille-initiale + nom */}
          {brandName && (
            <div className="mb-4 flex justify-center lg:justify-start">
              {scooter.brand?.logo_url ? (
                <span className="inline-flex items-center bg-white rounded-xl px-3 py-2 shadow-sm border border-[#ECE7DD]">
                  <img
                    src={scooter.brand.logo_url}
                    alt={brandName}
                    className="h-6 w-auto max-w-[120px] object-contain"
                    loading="eager"
                  />
                </span>
              ) : (
                <span className="inline-flex items-center rounded-xl overflow-hidden shadow-sm border border-[#ECE7DD]">
                  <span
                    className="flex items-center justify-center w-9 h-9 text-white text-base"
                    style={{ backgroundColor: accent, fontFamily: UNBOUNDED, fontWeight: 800 }}
                  >
                    {brandInitial}
                  </span>
                  <span
                    className="px-3 py-2 bg-white text-sm font-bold uppercase tracking-wide text-[#1A1A1A]"
                    style={{ fontFamily: FONT }}
                  >
                    {brandName}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Nom modèle — Unbounded font-black énorme */}
          <h1
            className="text-5xl lg:text-6xl xl:text-7xl leading-[0.92] mb-3"
            style={{
              fontFamily: UNBOUNDED,
              fontWeight: 900,
              color: "#1A1A1A",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
            }}
          >
            {scooter.name}
          </h1>

          {/* Sous-titre */}
          <p className="text-sm lg:text-base mb-6" style={{ color: "#6B7280", fontFamily: FONT }}>
            {brandName ? `${brandName} — ` : ""}pièces compatibles &amp; spécifications
          </p>

          {/* 3 chips specs */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-7 justify-center lg:justify-start">
              {chips.map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-baseline gap-1.5 rounded-full px-3.5 py-2 border"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.7)",
                    borderColor: "rgba(26,26,26,0.08)",
                    fontFamily: FONT,
                  }}
                >
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</span>
                  <span className="text-sm font-bold text-[#1A1A1A]">
                    {c.value}
                    <span className="text-xs font-semibold text-muted-foreground ml-0.5">{c.unit}</span>
                  </span>
                </span>
              ))}
            </div>
          )}

          <ShowroomActionButtons
            slug={scooter.slug}
            name={scooter.name}
            affiliateLink={scooter.affiliate_link}
          />
        </div>
      </div>
    </section>
  );
};

export default ShowroomHero;
