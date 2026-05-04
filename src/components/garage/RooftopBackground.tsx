import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RooftopBackgroundProps {
  intensity?: "normal" | "reduced";
  className?: string;
}

/**
 * Rooftop Sunset Marseille — pure CSS scenic background for /garage.
 * Layers (bottom → top): sky gradient, skyline silhouette, terrace floor, side plants.
 * Zero JS animations, zero external assets. `intensity="reduced"` flattens gradients
 * and removes any decorative blur for prefers-reduced-motion / accessibility.
 */
const RooftopBackground = ({ intensity = "normal", className }: RooftopBackgroundProps) => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const isReduced = intensity === "reduced" || reduceMotion;

  // Sky background — full sunset gradient OR flattened solid for reduced mode
  const skyStyle: React.CSSProperties = isReduced
    ? { background: "#C57E68" }
    : {
        background: [
          "radial-gradient(ellipse at 70% 25%, rgba(255, 180, 100, 0.45) 0%, transparent 45%)",
          "radial-gradient(ellipse at 20% 60%, rgba(255, 120, 80, 0.25) 0%, transparent 50%)",
          "linear-gradient(180deg, #2A3F5F 0%, #5A4F6E 25%, #C57E68 55%, #E8A878 75%, #F5C99B 95%)",
        ].join(", "),
      };

  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
      style={{ zIndex: 0 }}
    >
      {/* Sky */}
      <div className="absolute inset-0" style={skyStyle} />

      {/* Skyline silhouette */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "35%",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(20, 25, 40, 0.15) 60%, rgba(15, 20, 30, 0.4) 100%)",
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "60%",
            background: "rgba(20,25,40,0.7)",
            clipPath:
              "polygon(0 100%, 0 70%, 5% 70%, 5% 50%, 8% 50%, 8% 70%, 12% 70%, 12% 30%, 18% 30%, 18% 70%, 22% 70%, 22% 45%, 26% 45%, 26% 70%, 32% 70%, 32% 25%, 37% 25%, 37% 70%, 42% 70%, 42% 55%, 48% 55%, 48% 70%, 53% 70%, 53% 35%, 58% 35%, 58% 70%, 64% 70%, 64% 50%, 70% 50%, 70% 70%, 76% 70%, 76% 40%, 82% 40%, 82% 70%, 88% 70%, 88% 55%, 95% 55%, 95% 70%, 100% 70%, 100% 100%)",
          }}
        />
      </div>

      {/* Terrace floor */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "18%",
          background: "linear-gradient(180deg, transparent 0%, rgba(70, 60, 50, 0.4) 100%)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      />

      {/* Plants — left & right */}
      {!isReduced && (
        <>
          <div
            className="absolute"
            style={{
              left: "-30px",
              bottom: "-20px",
              width: "180px",
              height: "280px",
              opacity: 0.85,
              background:
                "radial-gradient(ellipse at center bottom, rgba(40, 60, 35, 0.7), transparent 70%)",
            }}
          />
          <div
            className="absolute"
            style={{
              right: "-30px",
              bottom: "-20px",
              width: "180px",
              height: "280px",
              opacity: 0.85,
              background:
                "radial-gradient(ellipse at center bottom, rgba(40, 60, 35, 0.65), transparent 70%)",
            }}
          />
        </>
      )}
    </div>
  );
};

export default RooftopBackground;
