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
 * Utilise par l'admin pour le preview live sans toucher au cache TanStack.
 */
export const HomeBridgeView = ({ settings }: HomeBridgeViewProps) => {
  const prefersReducedMotion = useReducedMotion();

  if (!settings.is_enabled) return null;

  const color = getWatermarkColor(
    settings.watermark_color_mode,
    settings.watermark_opacity,
  );

  return (
    <section
      aria-hidden="true"
      className="relative w-full overflow-hidden select-none pointer-events-none h-[100px] sm:h-[120px]"
    >
      <motion.span
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="absolute block whitespace-nowrap text-[clamp(50px,16vw,110px)] sm:text-[clamp(80px,14vw,200px)]"
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
