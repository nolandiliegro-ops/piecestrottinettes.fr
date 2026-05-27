import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import GarageWeekIntro from "./garage-week/GarageWeekIntro";
import GarageWeekHeader from "./garage-week/GarageWeekHeader";
import GarageWeekFrame from "./garage-week/GarageWeekFrame";
import GarageWeekPerks from "./garage-week/GarageWeekPerks";
import GarageWeekCTA from "./garage-week/GarageWeekCTA";

const NOLAN_AVATAR_URL =
  "https://kqsxscjtlipregkrmucg.supabase.co/storage/v1/object/public/rider-avatars/f9432d92-fd72-4f6a-bbf5-d4cbea2e233a/avatar.webp";
const WOLF_WARRIOR_IMAGE_URL =
  "https://kqsxscjtlipregkrmucg.supabase.co/storage/v1/object/public/scooter-photos/wolf-warrior-1769659333245.png";

export type FeaturedRider = {
  slug: string;
  name: string;
  level: number;
  levelTitle: string;
  xp: number;
  xpToNext: number;
  location: string;
  quote: string;
  avatarUrl: string;
  scooter: {
    brand: string;
    name: string;
    volt: number;
    amp: number;
    watt: number;
    imageUrl: string;
    partsInstalled: number;
    lastServiceDays: number;
  };
  memberSince: string;
  modCount: number;
  scooterCount: number;
  tutorials: number;
  metrics: {
    lastUpdate: string;
    weekViews: number;
    nextRiderIn: string;
  };
};

const FEATURED_RIDER: FeaturedRider = {
  slug: "nolan-2-0",
  name: "NOLAN2.0",
  level: 2,
  levelTitle: "Mécano",
  xp: 1265,
  xpToNext: 236,
  location: "Marseille",
  quote: "Founder du site, gérant Steedy Trott.",
  avatarUrl: NOLAN_AVATAR_URL,
  scooter: {
    brand: "KAABO",
    name: "WOLF WARRIOR",
    volt: 60,
    amp: 35,
    watt: 2400,
    imageUrl: WOLF_WARRIOR_IMAGE_URL,
    partsInstalled: 10,
    lastServiceDays: 12,
  },
  memberSince: "8 mois",
  modCount: 12,
  scooterCount: 1,
  tutorials: 3,
  metrics: {
    lastUpdate: "il y a 2 jours",
    weekViews: 42,
    nextRiderIn: "4 jours",
  },
};

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

const GarageOfTheWeekSection = () => {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();

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

        <motion.div variants={itemVariants} className="flex flex-col gap-5 lg:gap-6">
          <GarageWeekHeader rider={FEATURED_RIDER} />
          <GarageWeekFrame rider={FEATURED_RIDER} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <GarageWeekPerks />
        </motion.div>

        <motion.div variants={itemVariants}>
          <GarageWeekCTA user={user} />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default GarageOfTheWeekSection;
