import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import GarageWeekIntro from "./garage-week/GarageWeekIntro";
import GarageWeekFrame from "./garage-week/GarageWeekFrame";

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

// === Tunables ===
const RIDER_AUTOPLAY_DESKTOP_MS = 5000;
const RIDER_AUTOPLAY_MOBILE_MS = 6000;
const SCOOTER_AUTOPLAY_MS = 4000;
const PAUSE_AFTER_INTERACTION_MS = 10000;
// LVL 2 (Mécano) range = 501→1500 XP. Floor pour profils sous-XP.
const MIN_XP_FOR_LVL2 = 1265;

export type RiderScooter = {
  id: string;
  nickname: string | null;
  custom_photo_url: string | null;
  scooter_model: {
    id: string;
    slug: string | null;
    name: string;
    brand: string;
    image_url: string | null;
    voltage: number | null;
    amperage: number | null;
    power_watts: number | null;
  };
};

export type RiderBundle = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  rider_location: string | null;
  performance_points: number;
  active_theme_key: string | null;
  member_since: string;
  wallpaper_url: string | null;
  wallpaper_name: string | null;
  scooters: RiderScooter[];
};

const monthsSince = (iso: string | null | undefined): string => {
  if (!iso) return "récemment";
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return "récemment";
  const now = new Date();
  const months =
    (now.getFullYear() - created.getFullYear()) * 12 +
    (now.getMonth() - created.getMonth());
  if (months < 1) return "ce mois-ci";
  if (months === 1) return "1 mois";
  if (months < 12) return `${months} mois`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 an" : `${years} ans`;
};

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : true
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
};

const GarageOfTheWeekSection = () => {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const isDesktop = useIsDesktop();

  // 1. Profils publics (ordre BDD created_at ASC) — zéro hardcode
  const { data: publicProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["garage-of-the-week-v4", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, display_name, avatar_url, bio, rider_location, performance_points, created_at, active_theme_key"
        )
        .eq("is_public", true)
        .order("created_at", { ascending: true });
      if (error) {
        console.warn("[GarageOfTheWeek] profiles fetch", error.message);
        return [];
      }
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const riderIds = useMemo(
    () => (publicProfiles ?? []).map((p) => p.id),
    [publicProfiles]
  );
  const themeKeys = useMemo(
    () =>
      Array.from(
        new Set(
          (publicProfiles ?? [])
            .map((p) => p.active_theme_key)
            .filter((k): k is string => !!k)
        )
      ),
    [publicProfiles]
  );

  // 2. Wallpapers batch
  const { data: themes } = useQuery({
    queryKey: ["garage-of-the-week-v4", "themes", themeKeys.join("|")],
    enabled: themeKeys.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garage_themes")
        .select("key, name, image_url")
        .in("key", themeKeys);
      if (error) {
        console.warn("[GarageOfTheWeek] themes fetch", error.message);
        return [];
      }
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // 3. Trottis de chaque rider featured (RLS publique active)
  const { data: garageEntries } = useQuery({
    queryKey: ["garage-of-the-week-v4", "user-garage", riderIds.join("|")],
    enabled: riderIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_garage")
        .select(
          `id, user_id, scooter_model_id, nickname, custom_photo_url,
           scooter_models (
             id, slug, name, image_url, voltage, amperage, power_watts,
             brand:brands!scooter_models_brand_id_fkey(name)
           )`
        )
        .in("user_id", riderIds);
      if (error) {
        console.warn("[GarageOfTheWeek] user_garage fetch", error.message);
        return [];
      }
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Construit les bundles : un par rider, avec ses trottis filtrées
  const ridersBundle: RiderBundle[] = useMemo(() => {
    if (!publicProfiles?.length) return [];
    const themeMap = new Map(
      (themes ?? []).map((t) => [t.key, t])
    );
    const scootersByUser = new Map<string, RiderScooter[]>();

    for (const entry of garageEntries ?? []) {
      const model: any = entry.scooter_models;
      if (!model) continue;
      // Filtrer : on garde uniquement les trottis avec au moins une image
      const hasImage = !!(entry.custom_photo_url || model.image_url);
      if (!hasImage) continue;

      const brandName =
        typeof model.brand === "object"
          ? model.brand?.name ?? "—"
          : model.brand ?? "—";

      const scooter: RiderScooter = {
        id: entry.id,
        nickname: entry.nickname?.trim() || null,
        custom_photo_url: entry.custom_photo_url || null,
        scooter_model: {
          id: model.id,
          slug: model.slug ?? null,
          name: model.name ?? "—",
          brand: brandName,
          image_url: model.image_url ?? null,
          voltage: model.voltage ?? null,
          amperage: model.amperage ?? null,
          power_watts: model.power_watts ?? null,
        },
      };

      const list = scootersByUser.get(entry.user_id) ?? [];
      list.push(scooter);
      scootersByUser.set(entry.user_id, list);
    }

    return publicProfiles
      .map((p) => {
        const theme = p.active_theme_key
          ? themeMap.get(p.active_theme_key)
          : null;
        return {
          id: p.id,
          display_name: p.display_name || "Rider",
          avatar_url: p.avatar_url,
          bio: p.bio?.trim() || null,
          rider_location: p.rider_location?.trim() || null,
          performance_points: Math.max(
            p.performance_points ?? 0,
            // Floor seulement pour Nolan (autres profils gardent leur vraie XP)
            p.display_name === "NOLAN2.0" ? MIN_XP_FOR_LVL2 : 0
          ),
          active_theme_key: p.active_theme_key ?? null,
          member_since: monthsSince(p.created_at),
          wallpaper_url: theme?.image_url ?? null,
          wallpaper_name: theme?.name ?? null,
          scooters: scootersByUser.get(p.id) ?? [],
        };
      })
      // On garde uniquement les riders qui ont au moins une trotti visible
      .filter((r) => r.scooters.length > 0);
  }, [publicProfiles, themes, garageEntries]);

  // === Carrousel state ===
  const [currentRiderIndex, setCurrentRiderIndex] = useState(0);
  const [currentScooterIndex, setCurrentScooterIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset le scooter index quand le rider change OU quand le bundle change
  useEffect(() => {
    setCurrentScooterIndex(0);
  }, [currentRiderIndex, ridersBundle.length]);

  // Clamp rider index si bundle shrinks
  useEffect(() => {
    if (ridersBundle.length > 0 && currentRiderIndex >= ridersBundle.length) {
      setCurrentRiderIndex(0);
    }
  }, [ridersBundle.length, currentRiderIndex]);

  const pauseAutoPlay = () => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(
      () => setIsPaused(false),
      PAUSE_AFTER_INTERACTION_MS
    );
  };

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  // Auto-play rider
  useEffect(() => {
    if (reduceMotion || isPaused || ridersBundle.length <= 1) return;
    const interval = isDesktop
      ? RIDER_AUTOPLAY_DESKTOP_MS
      : RIDER_AUTOPLAY_MOBILE_MS;
    const t = setInterval(() => {
      setCurrentRiderIndex((idx) => (idx + 1) % ridersBundle.length);
    }, interval);
    return () => clearInterval(t);
  }, [reduceMotion, isPaused, ridersBundle.length, isDesktop]);

  // Auto-play scooter (indépendant)
  useEffect(() => {
    if (reduceMotion || isPaused) return;
    const currentRider = ridersBundle[currentRiderIndex];
    if (!currentRider || currentRider.scooters.length <= 1) return;
    const t = setInterval(() => {
      setCurrentScooterIndex((idx) => (idx + 1) % currentRider.scooters.length);
    }, SCOOTER_AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [reduceMotion, isPaused, ridersBundle, currentRiderIndex]);

  // Handlers
  const goToRider = (idx: number) => {
    if (idx === currentRiderIndex || idx < 0 || idx >= ridersBundle.length) return;
    setCurrentRiderIndex(idx);
    pauseAutoPlay();
  };
  const nextRider = () => goToRider((currentRiderIndex + 1) % ridersBundle.length);
  const prevRider = () =>
    goToRider(
      (currentRiderIndex - 1 + ridersBundle.length) % ridersBundle.length
    );

  const goToScooter = (idx: number) => {
    const max = ridersBundle[currentRiderIndex]?.scooters.length ?? 0;
    if (max === 0 || idx < 0 || idx >= max) return;
    setCurrentScooterIndex(idx);
    pauseAutoPlay();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08,
        delayChildren: reduceMotion ? 0 : 0.05,
      },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.7,
        ease: easeOutExpo,
      },
    },
  };

  const isLoading = profilesLoading || (riderIds.length > 0 && !garageEntries);

  return (
    <section
      aria-labelledby="garage-of-the-week-title"
      className="relative px-4 sm:px-6 lg:px-8 py-16 lg:py-24 overflow-hidden"
      style={{ backgroundColor: "#FAFAF8" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,102,0,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(74,124,89,0.05) 0%, transparent 60%)",
        }}
      />

      <motion.div
        className="relative mx-auto max-w-7xl flex flex-col gap-12 lg:gap-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <GarageWeekIntro />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="w-full mx-auto max-w-[1440px]"
        >
          <GarageWeekFrame
            ridersBundle={ridersBundle}
            currentRiderIndex={currentRiderIndex}
            currentScooterIndex={currentScooterIndex}
            onPrevRider={prevRider}
            onNextRider={nextRider}
            onGoToRider={goToRider}
            onGoToScooter={goToScooter}
            isLoading={isLoading}
            isAuthenticated={!!user}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default GarageOfTheWeekSection;
