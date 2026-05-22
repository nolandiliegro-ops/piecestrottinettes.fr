import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { getBrandColors } from "@/contexts/ScooterContext";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const FONT = "'Plus Jakarta Sans', sans-serif";

interface Props {
  videoId: string;
  brandName: string;
  accentColor: string | null;
}

// Lite-facade YouTube embed: thumbnail + play button, iframe injected only on click.
// Saves ~500KB+ of JS/network on mount (mobile-friendly).
const BrandVideo = ({ videoId, brandName, accentColor }: Props) => {
  const reduce = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const accent = accentColor || getBrandColors(brandName).accent;
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <section className="px-4 py-16 lg:px-8 lg:py-24" style={{ backgroundColor: "#F5F0E8" }}>
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2"
            style={{ color: "#6B7280", fontFamily: FONT }}
          >
            — EN VIDÉO
          </p>
          <h2
            className="text-3xl lg:text-5xl mb-8 leading-none"
            style={{
              fontFamily: "'Anton', sans-serif",
              color: "#1A1A1A",
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
            }}
          >
            {brandName} en mouvement
          </h2>

          {/* Double-bezel frame */}
          <div
            className="rounded-[2rem] p-2"
            style={{ backgroundColor: "rgba(26,26,26,0.04)", border: "1px solid rgba(26,26,26,0.08)" }}
          >
            <div className="relative rounded-[calc(2rem-0.5rem)] overflow-hidden aspect-video bg-black">
              {loaded ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                  title={`Vidéo de présentation ${brandName}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setLoaded(true)}
                  aria-label={`Lire la vidéo de présentation ${brandName}`}
                  className="group absolute inset-0 w-full h-full"
                >
                  <img
                    src={thumb}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: accent }}
                    >
                      <Play className="w-7 h-7 lg:w-8 lg:h-8 text-white ml-1" strokeWidth={1.5} fill="currentColor" />
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BrandVideo;
