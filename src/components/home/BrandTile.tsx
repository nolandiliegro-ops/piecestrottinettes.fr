import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  BrandAxis,
  BrandWallItem,
  ChampionInfo,
  EntryStyle,
  TileSize,
  WatermarkPos,
} from "@/hooks/useBrandWall";

const SAFE = "#4A7C59";

const darkenHex = (hex: string | null, ratio = 0.82): string => {
  const raw = (hex && /^#?[0-9a-f]{6}$/i.test((hex || "").replace("#", ""))
    ? hex!
    : SAFE
  ).replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c * (1 - ratio) + 10 * ratio);
  const to = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to(mix(r))}${to(mix(g))}${to(mix(b))}`;
};

const tileSpanStyle = (size: TileSize, isMobile: boolean): React.CSSProperties => {
  if (size === "big") return { gridColumn: "span 2", gridRow: "span 2" };
  if (isMobile) return { gridColumn: "span 1", gridRow: "span 1" };
  if (size === "wide") return { gridColumn: "span 2" };
  if (size === "tall") return { gridRow: "span 2" };
  return {};
};

const watermarkStyle = (
  pos: WatermarkPos,
  size: TileSize,
  hover: boolean
): React.CSSProperties => {
  const big = size === "big";
  const base: React.CSSProperties = {
    position: "absolute",
    fontFamily: "'Unbounded', sans-serif",
    fontWeight: 900,
    color: hover ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.10)",
    lineHeight: 0.8,
    pointerEvents: "none",
    userSelect: "none",
    letterSpacing: "-0.05em",
    textTransform: "uppercase",
    transition: "color 400ms ease",
    transform: "translateZ(6px)",
  };
  switch (pos) {
    case "tl":
      return { ...base, left: "-10px", top: "-18px", fontSize: big ? "240px" : "100px" };
    case "bl":
      return { ...base, left: "-16px", bottom: "-34px", fontSize: big ? "240px" : "130px" };
    case "cc":
      return {
        ...base,
        right: "8%",
        top: "50%",
        transform: "translateY(-50%) translateZ(6px)",
        fontSize: big ? "240px" : "160px",
      };
    case "br-big":
      return { ...base, right: "-24px", bottom: "-46px", fontSize: big ? "240px" : "210px" };
    case "tr":
    default:
      return { ...base, right: "-14px", top: "-22px", fontSize: big ? "240px" : "120px" };
  }
};

interface EntryPreset {
  from: { x: number; y: number; r: number };
  to: { x: number; y: number; r: number };
  duration: number;
}

const PRESETS: Record<EntryStyle, EntryPreset> = {
  "punch-right": { from: { x: 85, y: 0, r: -8 }, to: { x: 2, y: 0, r: -5 }, duration: 750 },
  "glide-right": { from: { x: 90, y: 0, r: 3 }, to: { x: 0, y: 0, r: 0 }, duration: 1150 },
  "slide-left": { from: { x: -55, y: 0, r: 4 }, to: { x: 0, y: 0, r: 0 }, duration: 1000 },
  "rise-bottom": { from: { x: 18, y: 80, r: 2 }, to: { x: 0, y: 0, r: 0 }, duration: 900 },
  "dive-top": { from: { x: 70, y: -55, r: 8 }, to: { x: 0, y: 0, r: -2 }, duration: 1250 },
  "diag-br": { from: { x: 75, y: 65, r: 12 }, to: { x: 0, y: 0, r: -3 }, duration: 800 },
  "diag-bl": { from: { x: -60, y: 55, r: -14 }, to: { x: 0, y: 0, r: -6 }, duration: 850 },
};

const GenericScooter = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size * 0.75}
    viewBox="0 0 200 150"
    fill="rgba(255,255,255,0.55)"
    aria-hidden
  >
    <circle cx="40" cy="120" r="20" />
    <circle cx="40" cy="120" r="9" fill="rgba(0,0,0,0.3)" />
    <circle cx="160" cy="120" r="20" />
    <circle cx="160" cy="120" r="9" fill="rgba(0,0,0,0.3)" />
    <rect x="35" y="105" width="130" height="8" rx="4" />
    <rect x="38" y="35" width="8" height="75" rx="2" />
    <rect x="20" y="30" width="45" height="6" rx="3" />
    <rect x="130" y="93" width="35" height="14" rx="4" />
  </svg>
);

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
};

interface Props {
  brand: BrandWallItem;
  axis?: BrandAxis | null;
  champion?: ChampionInfo | null;
  isNumberOne?: boolean;
  isSponsored?: boolean;
  forceBig?: boolean;
}

const BrandTile = ({
  brand,
  axis = null,
  champion = null,
  isNumberOne = false,
  isSponsored = false,
  forceBig = false,
}: Props) => {
  const isMobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLAnchorElement>(null);

  const color = brand.signature_color || SAFE;
  const darkColor = useMemo(() => darkenHex(color, 0.82), [color]);
  const preset = PRESETS[brand.entry_style] ?? PRESETS["glide-right"];

  const axisActive = axis !== null;
  // In score mode: N1 stays big, everything else normal (no wide/tall/dense)
  const effectiveSize: TileSize = forceBig ? "big" : axisActive ? "normal" : brand.tile_size;

  useEffect(() => {
    if (!isMobile || reduced) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isMobile, reduced]);

  // Score mode always reveals the champion showcase; hover still adds tilt/depth
  const active = axisActive ? true : reduced ? true : isMobile ? visible : hover;

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobile || reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 9, y: px * 9 });
  };
  const handleMouseLeave = () => {
    setHover(false);
    setTilt({ x: 0, y: 0 });
  };

  const span = tileSpanStyle(effectiveSize, isMobile);
  const logoSize =
    effectiveSize === "big"
      ? 92
      : effectiveSize === "wide" || effectiveSize === "tall"
        ? 66
        : 52;
  const scooterSize =
    effectiveSize === "big"
      ? 260
      : effectiveSize === "wide"
        ? 200
        : effectiveSize === "tall"
          ? 170
          : 150;

  const nameSize =
    effectiveSize === "big"
      ? "text-3xl md:text-4xl"
      : effectiveSize === "wide" || effectiveSize === "tall"
        ? "text-xl md:text-2xl"
        : "text-lg md:text-xl";

  const showcaseTransform = active
    ? `translate(${preset.to.x}px, ${preset.to.y}px) rotate(${preset.to.r}deg) translateZ(42px)`
    : `translate(${preset.from.x}px, ${preset.from.y}px) rotate(${preset.from.r}deg)`;
  const showcaseOpacity = active ? 0.96 : 0;

  const axisLabel = axis === "autonomy" ? "Autonomie" : "Performance";
  const axisIcon = axis === "autonomy" ? "🔋" : "⚡";
  const displayImage = axisActive
    ? champion?.image_url ?? brand.showcase_image_url
    : brand.showcase_image_url;

  return (
    <Link
      ref={wrapRef}
      to={`/marque/${brand.slug}`}
      onMouseEnter={() => !isMobile && !reduced && setHover(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      aria-label={`Découvrir ${brand.name}`}
      className="relative block group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      style={{
        ...span,
        background: `linear-gradient(155deg, ${color} 0%, ${darkColor} 100%)`,
        borderRadius: 18,
        transformStyle: "preserve-3d",
        transform:
          reduced || isMobile
            ? undefined
            : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 140ms ease, box-shadow 300ms ease",
        boxShadow: hover
          ? `0 24px 60px ${color}55, 0 8px 20px rgba(0,0,0,0.25)`
          : "0 8px 20px rgba(0,0,0,0.18)",
        zIndex: hover ? 30 : 1,
        minHeight: 140,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: 18, overflow: "hidden" }}
      >
        <div
          aria-hidden
          className="absolute -top-16 -right-14 rounded-full"
          style={{
            width: 230,
            height: 230,
            background: color,
            filter: "blur(55px)",
            opacity: active ? 0.62 : 0,
            transition: "opacity 400ms ease",
          }}
        />

        <span aria-hidden style={watermarkStyle(brand.watermark_pos, effectiveSize, hover)}>
          {brand.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: 18,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 flex items-end justify-end p-3 pointer-events-none"
      >
        <div
          style={{
            transform: showcaseTransform,
            opacity: showcaseOpacity,
            transition: reduced
              ? "none"
              : `transform ${preset.duration}ms cubic-bezier(.28,1.4,.5,1), opacity ${preset.duration}ms ease`,
            filter: "drop-shadow(0 13px 21px rgba(0,0,0,0.5))",
          }}
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ width: scooterSize, height: "auto", objectFit: "contain" }}
            />
          ) : (
            <GenericScooter size={scooterSize} />
          )}
        </div>
      </div>

      {!axisActive && brand.is_star && (
        <span
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 uppercase"
          style={{
            backgroundColor: "#FFB300",
            color: "#1A1A1A",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 10,
            letterSpacing: "0.14em",
            fontWeight: 800,
            fontFamily: "'Sora', sans-serif",
            boxShadow: "0 4px 12px rgba(255,179,0,0.45)",
          }}
        >
          ★ Star
        </span>
      )}

      {!axisActive && brand.youtube_video_id && (
        <span
          className="hidden sm:inline-flex absolute top-3 right-3 z-10 items-center gap-1"
          style={{
            backgroundColor: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
            color: "#FFFFFF",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 10,
            letterSpacing: "0.14em",
            fontWeight: 700,
            fontFamily: "'Sora', sans-serif",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          ◉ Vidéo
        </span>
      )}

      {axisActive && isNumberOne && (
        <span
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 uppercase"
          style={{
            backgroundColor: "#FFB300",
            color: "#1A1A1A",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 10,
            letterSpacing: "0.14em",
            fontWeight: 800,
            fontFamily: "'Sora', sans-serif",
            boxShadow: "0 4px 12px rgba(255,179,0,0.45)",
          }}
        >
          N°1 {axisLabel}
        </span>
      )}

      {axisActive && isSponsored && (
        <span
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1"
          style={{
            backgroundColor: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
            color: "#FFFFFF",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 10,
            letterSpacing: "0.14em",
            fontWeight: 700,
            fontFamily: "'Sora', sans-serif",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          Sponsorisé
        </span>
      )}

      <div
        className="relative z-10 h-full flex flex-col justify-between p-4 md:p-5"
        style={{ transform: "translateZ(30px)" }}
      >
        <div
          className="flex items-center justify-center bg-white rounded-2xl overflow-hidden"
          style={{
            width: logoSize,
            height: logoSize,
            padding: 8,
            transition: "box-shadow 300ms ease",
            boxShadow:
              effectiveSize === "big"
                ? hover
                  ? "0 0 0 6px rgba(255,255,255,0.18), 0 18px 40px -8px rgba(0,0,0,0.72)"
                  : "0 0 0 6px rgba(255,255,255,0.10), 0 14px 30px -8px rgba(0,0,0,0.6)"
                : "0 6px 16px rgba(0,0,0,0.25)",
          }}
        >
          {brand.logo_url ? (
            <img
              src={brand.logo_url}
              alt={`${brand.name} logo`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain"
            />
          ) : (
            <span
              aria-hidden
              style={{
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 900,
                fontSize: logoSize * 0.5,
                color: "#1A1A1A",
              }}
            >
              {brand.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h3
            className={`${nameSize} truncate`}
            style={{
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 800,
              color: "#FFFFFF",
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            {brand.name}
          </h3>
          {axisActive && champion ? (
            <p
              className="mt-2 text-sm truncate"
              style={{
                fontFamily: "'Sora', sans-serif",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 500,
              }}
            >
              {axisIcon} Champion : {champion.name}
              {champion.score !== null ? ` · ${champion.score}` : ""}
            </p>
          ) : (
            <p
              className="mt-2 text-sm truncate"
              style={{
                fontFamily: "'Sora', sans-serif",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 500,
              }}
            >
              {brand.models_count} modèle{brand.models_count === 1 ? "" : "s"}
              {brand.country ? ` · ${brand.country}` : ""}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BrandTile;
