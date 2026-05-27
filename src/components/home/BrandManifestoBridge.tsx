import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const useHomeStats = () =>
  useQuery({
    queryKey: ["home_bridge_stats"],
    queryFn: async () => {
      const [parts, brands] = await Promise.all([
        supabase
          .from("parts")
          .select("*", { count: "exact", head: true })
          .eq("published", true),
        supabase
          .from("brands")
          .select("*", { count: "exact", head: true })
          .eq("published", true),
      ]);
      return {
        partsCount: parts.count ?? 0,
        brandsCount: brands.count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

const BrandManifestoBridge = () => {
  const { data } = useHomeStats();
  const partsCount = data?.partsCount ?? 99;
  const brandsCount = data?.brandsCount ?? 12;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: "#FAFAF8" }}
      aria-label="Manifeste piècestrottinettes"
    >
      <style>{`
        @keyframes ptBridgeMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .pt-bridge-marquee {
          display: flex;
          width: max-content;
          animation: ptBridgeMarquee 28s linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .pt-bridge-marquee { animation: none; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16 flex flex-col gap-8 lg:gap-12">
        {/* Marquee bandeau orange brut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative -mx-4 py-3 lg:py-4 overflow-hidden shadow-lg"
          style={{
            backgroundColor: "#FF6600",
            transform: "rotate(-1.5deg)",
          }}
          aria-hidden
        >
          <div className="pt-bridge-marquee whitespace-nowrap items-center">
            {[0, 1].map((k) => (
              <span
                key={k}
                className="px-6 text-white text-xl lg:text-2xl"
                style={{
                  fontFamily: "'Anton', sans-serif",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                Expédition 24h · Pièces certifiées · SAV par un mécano pro ·
                Compatibilité garantie · Roule · Répare · Dure · Expédition 24h
                · Pièces certifiées · SAV par un mécano pro · Compatibilité
                garantie · Roule · Répare · Dure ·{" "}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Bento stats premium */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="col-span-2 relative overflow-hidden rounded-3xl p-6 lg:p-10 shadow-lg flex flex-col justify-between min-h-[200px] lg:min-h-[240px]"
            style={{ backgroundColor: "#4A7C59", color: "#FFFFFF" }}
          >
            <div
              aria-hidden
              className="absolute -right-8 -top-8 w-40 h-40 rounded-full"
              style={{ background: "rgba(255,255,255,0.08)", filter: "blur(40px)" }}
            />
            <div
              aria-hidden
              className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full"
              style={{ background: "rgba(255,102,0,0.18)", filter: "blur(50px)" }}
            />

            <span
              className="text-[10px] lg:text-xs font-extrabold uppercase tracking-[0.25em] opacity-80 mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Stock disponible
            </span>
            <div className="flex items-end gap-3">
              <span
                className="text-7xl lg:text-9xl leading-[0.8]"
                style={{
                  fontFamily: "'Anton', sans-serif",
                  letterSpacing: "-0.03em",
                }}
              >
                {partsCount}
              </span>
              <span
                className="text-lg lg:text-2xl font-extrabold mb-1 lg:mb-2"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  letterSpacing: "0.02em",
                }}
              >
                PIÈCES
              </span>
            </div>
            <p
              className="text-sm lg:text-base mt-4 opacity-90 leading-snug max-w-[260px] lg:max-w-md"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              La gamme la plus large pour ta trotti, prête à expédier.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="rounded-3xl p-5 lg:p-7 flex flex-col items-start justify-center shadow-sm"
            style={{
              backgroundColor: "#FFFFFF",
              border: "0.5px solid rgba(0,0,0,0.05)",
            }}
          >
            <span
              className="text-5xl lg:text-6xl"
              style={{
                fontFamily: "'Anton', sans-serif",
                color: "#FF6600",
                letterSpacing: "-0.02em",
              }}
            >
              {brandsCount}
            </span>
            <span
              className="text-[10px] lg:text-xs font-extrabold uppercase tracking-[0.2em] text-gray-500 mt-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Marques
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="rounded-3xl p-5 lg:p-7 flex flex-col items-start justify-center"
            style={{ backgroundColor: "#EEF2EC" }}
          >
            <span
              className="text-5xl lg:text-6xl"
              style={{
                fontFamily: "'Anton', sans-serif",
                color: "#4A7C59",
                letterSpacing: "-0.02em",
              }}
            >
              24H
            </span>
            <span
              className="text-[10px] lg:text-xs font-extrabold uppercase tracking-[0.2em] mt-1"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: "rgba(74,124,89,0.7)",
              }}
            >
              Expédition
            </span>
          </motion.div>
        </div>

        {/* Manifeste typographique */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="px-1 lg:px-2"
        >
          <div className="flex items-center gap-3 mb-3">
            <span
              className="block"
              style={{ height: 2, width: 32, backgroundColor: "#FF6600" }}
            />
            <span
              className="text-[10px] lg:text-xs font-extrabold uppercase tracking-[0.2em]"
              style={{
                color: "#FF6600",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Manifeste
            </span>
          </div>

          <h2
            className="text-[44px] sm:text-6xl lg:text-7xl leading-[0.88] uppercase"
            style={{
              fontFamily: "'Anton', sans-serif",
              color: "#1A1A1A",
              letterSpacing: "-0.02em",
            }}
          >
            Ta trotti.
            <br />
            <span style={{ color: "#4A7C59" }}>Notre obsession.</span>
          </h2>

          <p
            className="mt-4 lg:mt-5 text-sm lg:text-base max-w-md leading-relaxed"
            style={{
              color: "#6B7280",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Plus qu'un catalogue — une expertise. Chaque pièce est sélectionnée
            par un mécano pro pour que tu ne te trompes plus jamais.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default BrandManifestoBridge;
