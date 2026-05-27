import { useHomeBridge } from "@/hooks/useHomeBridge";

/**
 * Filigrane permanent en fond global : 3 occurrences du watermark_text
 * reparties verticalement sur le viewport. Position fixed pour suivre le scroll.
 * z-index 0 -> derriere tout contenu (main est en z-10).
 */
const POSITIONS = ["20%", "60%", "100%"] as const;

const SiteWatermark = () => {
  const { data } = useHomeBridge();

  if (!data || !data.is_enabled) return null;

  const alpha = Math.max(0, Math.min(15, data.watermark_opacity)) / 100;
  const color =
    data.watermark_color_mode === "light"
      ? `rgba(255, 255, 255, ${alpha})`
      : `rgba(26, 26, 26, ${alpha})`;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden"
    >
      {POSITIONS.map((top, i) => (
        <span
          key={i}
          className="absolute block whitespace-nowrap"
          style={{
            left: "-2vw",
            top,
            fontFamily: "'Anton', sans-serif",
            fontSize: "clamp(100px, 14vw, 220px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
            color,
          }}
        >
          {data.watermark_text}
        </span>
      ))}
    </div>
  );
};

export default SiteWatermark;
