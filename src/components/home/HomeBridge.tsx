import { motion, useReducedMotion } from "framer-motion";
import {
  useHomeBridge,
  type HomeBridgeColorMode,
  type HomeBridgeSettings,
} from "@/hooks/useHomeBridge";

interface HomeBridgeViewProps {
  settings: HomeBridgeSettings;
}

function getWatermarkColor(mode: HomeBridgeColorMode, opacity: number) {
  const alpha = Math.max(0, Math.min(15, opacity)) / 100;
  if (mode === "light") return `rgba(255, 255, 255, ${alpha})`;
  return `rgba(26, 26, 26, ${alpha})`;
}

/**
 * Variant primitif data-less : prend les settings en prop.
 * Bande bicolore anthracite avec filigrane blanc.
 * Utilise par l'admin pour le preview live sans toucher au cache TanStack.
 */
export const HomeBridgeView = ({ settings }: HomeBridgeViewProps) => {
  const prefersReducedMotion = useReducedMotion();

  if (!settings.is_enabled) return null;

  // Force mode "light" (filigrane blanc sur fond anthracite).
  // Opacity x2 capee a 15 pour visibilite correcte sur fond sombre.
  const color = getWatermarkColor(
    "light",
    Math.min(settings.watermark_opacity * 2, 15),
  );

  return (
    <section
      aria-hidden="true"
      className="relative w-full overflow-hidden select-none pointer-events-none h-[140px] sm:h-[180px]"
      style={{ background: settings.dark_block_color }}
    >
      <motion.span
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="absolute block whitespace-nowrap text-[clamp(80px,14vw,200px)] sm:text-[clamp(100px,12vw,240px)]"
        style={{
          left: "-2vw",
          top: "50%",
          transform: "translateY(-50%)",
          fontFamily: "'Anton', sans-serif",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          lineHeight: 0.85,
          color,
        }}
      >
        {settings.watermark_text}
      </motion.span>

      {/* Fade transition depuis le fond beige #FAFAF8 vers le bloc dark */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "32px",
          background: "linear-gradient(180deg, #FAFAF8 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
    </section>
  );
};

/**
 * Wrapper data-driven : fetch BDD via useHomeBridge.
 * Usage standard dans Index.tsx.
 */
const HomeBridge = () => {
  const { data, isLoading } = useHomeBridge();
  if (isLoading || !data) return null;
  return <HomeBridgeView settings={data} />;
};

export default HomeBridge;
