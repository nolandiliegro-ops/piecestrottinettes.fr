import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  useHomeBridge,
  type HomeBridgeColorMode,
  type HomeBridgeSettings,
} from "@/hooks/useHomeBridge";

const TRUST_SIGNALS = [
  "Livraison 24h",
  "12 000 pièces dispo",
  "Compat garantie",
] as const;

interface HomeBridgeViewProps {
  settings: HomeBridgeSettings;
}

function getWatermarkColor(mode: HomeBridgeColorMode, opacity: number) {
  const alpha = Math.max(0, Math.min(15, opacity)) / 100;
  if (mode === "light") return `rgba(255, 255, 255, ${alpha})`;
  return `rgba(26, 26, 26, ${alpha})`;
}

function getSeparatorColor(mode: HomeBridgeColorMode) {
  if (mode === "light") return "rgba(255, 180, 140, 0.6)";
  return "rgba(255, 102, 0, 0.5)";
}

/**
 * Variant primitif data-less : prend les settings en prop.
 * Utilise par l'admin pour le preview live sans toucher au cache TanStack.
 */
export const HomeBridgeView = ({ settings }: HomeBridgeViewProps) => {
  const prefersReducedMotion = useReducedMotion();

  if (!settings.is_enabled) return null;

  const brandColor = getWatermarkColor(
    settings.watermark_color_mode,
    settings.watermark_opacity,
  );
  const signalColor = getWatermarkColor(
    settings.watermark_color_mode,
    Math.min(settings.watermark_opacity * 1.5, 15),
  );
  const sepColor = getSeparatorColor(settings.watermark_color_mode);

  const renderSequence = (keyPrefix: string) =>
    TRUST_SIGNALS.map((label, i) => (
      <Fragment key={`${keyPrefix}-${i}`}>
        <span
          className="block whitespace-nowrap shrink-0 text-[clamp(80px,12vw,180px)] sm:text-[clamp(100px,11vw,200px)]"
          style={{
            fontFamily: "'Anton', sans-serif",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
            color: brandColor,
            paddingRight: 50,
          }}
        >
          {settings.watermark_text}
        </span>
        <span
          aria-hidden="true"
          className="block rounded-full self-center shrink-0"
          style={{
            width: 8,
            height: 8,
            background: sepColor,
            marginRight: 50,
          }}
        />
        <span
          className="block whitespace-nowrap shrink-0 text-[clamp(28px,4.5vw,56px)]"
          style={{
            fontFamily: "'Anton', sans-serif",
            fontWeight: 900,
            letterSpacing: "0.05em",
            lineHeight: 0.85,
            textTransform: "uppercase",
            color: signalColor,
            paddingRight: 50,
          }}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          className="block rounded-full self-center shrink-0"
          style={{
            width: 8,
            height: 8,
            background: sepColor,
            marginRight: 50,
          }}
        />
      </Fragment>
    ));

  return (
    <section
      aria-hidden="true"
      className="relative w-full overflow-hidden select-none pointer-events-none h-[130px] sm:h-[160px]"
    >
      <div className="absolute inset-y-0 left-0 flex items-center">
        <motion.div
          className="flex items-center"
          style={{ width: "max-content" }}
          animate={prefersReducedMotion ? { x: 0 } : { x: "-50%" }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  duration: 28,
                  ease: "linear",
                  repeat: Infinity,
                  repeatType: "loop",
                }
          }
        >
          {renderSequence("a")}
          {renderSequence("b")}
        </motion.div>
      </div>
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
