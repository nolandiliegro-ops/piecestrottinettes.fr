import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Disc,
  Cog,
  Battery,
  Cpu,
  Lightbulb,
  Backpack,
  LucideIcon,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategoryImages, type CategoryImageData } from "@/hooks/useCategoryImages";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface CategoryBentoCardProps {
  category: Category;
  partsCount: number;
  isHero?: boolean;
  index: number;
}

const iconMap: Record<string, LucideIcon> = {
  pneus: Disc,
  "disques-plaquettes": Disc,
  "chambres-air": CircleDot,
  moteurs: Cog,
  batteries: Battery,
  controleurs: Cpu,
  chargeurs: Cpu,
  lumieres: Lightbulb,
  accessoires: Backpack,
};

const neonColors: Record<string, string> = {
  pneus: "#00BCD4",
  "disques-plaquettes": "#FF1744",
  "chambres-air": "#FFB300",
  chargeurs: "#00E676",
  batteries: "#7C4DFF",
  lumieres: "#FFD600",
  accessoires: "#FF9100",
};

const racingLabels: Record<string, string> = {
  pneus: "PERFORMANCE",
  "disques-plaquettes": "RACING",
  "chambres-air": "ENDURANCE",
  chargeurs: "HAUTE PRÉCISION",
  batteries: "POWER",
  lumieres: "VISIBILITÉ",
  accessoires: "CUSTOM",
};

const CategoryBentoCard = ({
  category,
  partsCount,
  isHero = false,
  index,
}: CategoryBentoCardProps) => {
  const { data: categoryImages = {} } = useCategoryImages();
  const [isHovered, setIsHovered] = useState(false);

  const IconComponent = iconMap[category.slug] || Backpack;
  const imgData = categoryImages[category.id] as CategoryImageData | undefined;
  const imageUrl = imgData?.image_url;
  const altText = imgData?.alt_text || category.name;
  const subtitle = imgData?.subtitle;
  const neon = neonColors[category.slug] || "#93B5A1";
  const racingLabel = subtitle || racingLabels[category.slug] || "PREMIUM";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(isHero && "col-span-2 row-span-2")}
    >
      <Link to={`/catalogue?category=${category.slug}`}>
        <motion.div
          whileHover={{
            scale: 1.03,
            y: -6,
            transition: { duration: 0.4, ease: "easeOut" },
          }}
          whileTap={{ scale: 0.98 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className={cn(
            "group relative overflow-hidden cursor-pointer",
            "rounded-2xl",
            "transition-shadow duration-300",
            isHero ? "aspect-square" : "aspect-[4/3]"
          )}
          style={{
            background: "rgba(26,26,30,0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `0.5px solid ${neon}35`,
            boxShadow: isHovered
              ? `0 0 30px ${neon}35, inset 0 1px 0 hsla(0,0%,100%,0.04)`
              : `0 0 15px ${neon}15, inset 0 1px 0 hsla(0,0%,100%,0.04)`,
          }}
        >
          {/* Category image with zoom */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <motion.div
              className="absolute inset-0 w-full h-full"
              animate={{ scale: isHovered ? 1.08 : 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={altText}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent" />
              )}
            </motion.div>

            {/* Dark overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, hsla(0,0%,0%,0.85) 0%, hsla(0,0%,0%,0.4) 50%, hsla(0,0%,0%,0.2) 100%)",
              }}
            />
          </div>

          {/* Icon badge */}
          <div className="absolute top-3 right-3 lg:top-4 lg:right-4 z-10">
            <div
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center"
              style={{
                background: "hsla(0,0%,0%,0.5)",
                backdropFilter: "blur(8px)",
                border: `1px solid ${neon}40`,
              }}
            >
              <IconComponent
                className="w-4 h-4 lg:w-5 lg:h-5"
                style={{ color: neon }}
              />
            </div>
          </div>

          {/* Content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 lg:p-5 z-10 flex flex-col justify-end">
            <span
              className="font-montserrat text-[10px] lg:text-xs font-bold tracking-[0.2em] uppercase mb-1"
              style={{ color: `${neon}BB` }}
            >
              {racingLabel}
            </span>

            <h3
              className={cn(
                "font-display uppercase text-white",
                isHero ? "text-3xl lg:text-5xl" : "text-lg lg:text-xl"
              )}
              style={{
                fontWeight: 800,
                letterSpacing: "0.04em",
                textShadow: `0 0 20px ${neon}40`,
              }}
            >
              {category.name}
            </h3>

            <motion.div
              initial={false}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 6 }}
              transition={{ duration: 0.25 }}
              className="mt-2"
            >
              <span
                className="inline-block px-2.5 py-1 rounded-md font-montserrat text-[10px] lg:text-xs font-bold uppercase tracking-widest"
                style={{
                  background: `${neon}15`,
                  color: neon,
                  border: `1px solid ${neon}30`,
                }}
              >
                {partsCount} modèles en stock
              </span>
            </motion.div>
          </div>

          {/* Neon accent lines */}
          <div
            className="absolute top-0 left-0 w-12 h-[1px] z-10 rounded-br"
            style={{ background: neon }}
          />
          <div
            className="absolute top-0 left-0 h-12 w-[1px] z-10 rounded-br"
            style={{ background: neon }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default CategoryBentoCard;
