import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { getBrandColors } from "@/contexts/ScooterContext";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const FONT = "'Plus Jakarta Sans', sans-serif";

interface Props {
  brandName: string;
  brandSlug: string;
  accentColor: string | null;
}

// Final CTA → /catalogue?brand=:slug, with the button-in-button trailing icon.
const BrandCTA = ({ brandName, brandSlug, accentColor }: Props) => {
  const reduce = useReducedMotion();
  const accent = accentColor || getBrandColors(brandName).accent;

  return (
    <section className="px-4 py-20 lg:px-8 lg:py-32" style={{ backgroundColor: "#F5F0E8" }}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: EASE }}
        className="mx-auto max-w-3xl text-center"
      >
        <h2
          className="text-4xl lg:text-6xl leading-[0.95] mb-8"
          style={{
            fontFamily: "'Anton', sans-serif",
            color: "#1A1A1A",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
          }}
        >
          Toutes les pièces {brandName}
        </h2>

        <Link
          to={`/catalogue?brand=${brandSlug}`}
          aria-label={`Voir le catalogue des pièces ${brandName}`}
          className="group inline-flex items-center gap-3 min-h-[56px] pl-7 pr-3 rounded-full text-white font-bold uppercase tracking-wider transition-transform active:scale-[0.98]"
          style={{ backgroundColor: "#1A1A1A", fontFamily: FONT }}
        >
          <span className="text-sm">Voir le catalogue</span>
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-[1px]"
            style={{ backgroundColor: accent }}
          >
            <ArrowRight className="w-4 h-4 text-white" strokeWidth={1.5} />
          </span>
        </Link>
      </motion.div>
    </section>
  );
};

export default BrandCTA;
