import { motion, useReducedMotion } from "framer-motion";
import { Quote } from "lucide-react";
import { getBrandColors } from "@/contexts/ScooterContext";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const FONT = "'Plus Jakarta Sans', sans-serif";

interface Props {
  note: string;
  brandName: string;
  accentColor: string | null;
}

// USP section — placed BEFORE the story (Nolan's editorial decision).
// Double-bezel signature card (outer shell + inner core).
const BrandExpertNote = ({ note, brandName, accentColor }: Props) => {
  const reduce = useReducedMotion();
  const accent = accentColor || getBrandColors(brandName).accent;

  return (
    <section className="px-4 py-16 lg:px-8 lg:py-24" style={{ backgroundColor: "#F5F0E8" }}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: EASE }}
        className="mx-auto max-w-3xl"
      >
        {/* Outer shell */}
        <div className="rounded-[2rem] p-2" style={{ backgroundColor: "rgba(26,26,26,0.04)", border: `1px solid ${accent}33` }}>
          {/* Inner core */}
          <div
            className="rounded-[calc(2rem-0.5rem)] bg-white p-7 lg:p-10"
            style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <span
                className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold text-white"
                style={{ backgroundColor: accent, fontFamily: FONT }}
              >
                L'avis Steedy Trott
              </span>
            </div>

            <Quote className="w-8 h-8 mb-3" strokeWidth={1.5} style={{ color: accent }} aria-hidden />

            <p
              className="text-xl lg:text-2xl leading-relaxed whitespace-pre-line"
              style={{ color: "#1A1A1A", fontFamily: FONT }}
            >
              {note}
            </p>

            <div className="mt-7 flex items-center gap-3">
              <div
                aria-hidden
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                style={{ backgroundColor: accent, fontFamily: "'Anton', sans-serif" }}
              >
                N
              </div>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: "#1A1A1A", fontFamily: FONT }}>Nolan</p>
                <p className="text-xs" style={{ color: "#6B7280", fontFamily: FONT }}>Steedy Trott · Marseille</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default BrandExpertNote;
