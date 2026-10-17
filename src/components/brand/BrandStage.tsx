/**
 * Visuel du haut de page marque — 5 mises en scène (17/10/2026, skill « cinq propositions rendues »).
 * Défaut corrigé : sans photo de marque (41 marques sur 50), le haut de page montrait trois petites
 * trottinettes alignées. Ici : UNE trottinette, le modèle phare (le plus puissant), en grand,
 * habillée de la couleur de la marque (config/brandIdentity). Marque avec photo : la photo reste.
 * Choix par ?scene=1..5.
 *
 * 1 STUDIO      · fond carbone, halo de la couleur de la marque, reflet au sol
 * 2 AFFICHE     · plaque pleine couleur, nom de marque géant en contour, la trottinette déborde
 * 3 LIVRÉE      · carbone + bandes de course diagonales à la couleur de la marque
 * 4 GROS PLAN   · fond clair, trottinette zoomée et recadrée, coin couleur
 * 5 FICHE TECH  · grille d'atelier carbone, cotes du modèle phare (W, km/h, km)
 */
import { Link } from "react-router-dom";
import type { BrandData, BrandModel } from "@/hooks/useBrandData";
import { optimizedImage } from "@/lib/imageTransform";
import { brandIdentity, flagshipOf, BRAND_PHOTOS } from "@/config/brandIdentity";

export type StageScene = 1 | 2 | 3 | 4 | 5;
export const STAGE_NAMES: Record<StageScene, string> = { 1: "Studio", 2: "Affiche", 3: "Livrée", 4: "Gros plan", 5: "Fiche tech" };

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const CHAMFER = "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)";

interface Props { brand: BrandData; models: BrandModel[]; scene: StageScene }

const Signature = ({ light = true }: { light?: boolean }) => (
  <span className="hidden sm:block absolute right-4 bottom-3 z-20 text-sm" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: light ? "rgba(255,255,255,0.55)" : "rgba(26,26,26,0.35)" }}>
    piecestrottinettes.fr
  </span>
);

const Caption = ({ m, light = true, accent }: { m: BrandModel; light?: boolean; accent: string }) => (
  <Link to={`/scooter/${m.slug}`} className="absolute left-4 bottom-3 z-20 inline-flex items-center gap-2 min-h-[44px] text-sm font-bold" style={{ fontFamily: FONT, color: light ? "#fff" : CARBON }}>
    <span className="w-6 h-[3px]" style={{ background: accent }} />
    <span className="hidden sm:inline uppercase tracking-[0.12em] opacity-70">Modèle phare</span>
    <span className="font-extrabold truncate max-w-[calc(100vw-90px)] sm:max-w-[320px]">{m.name}</span>
  </Link>
);

const Scooter = ({ m, className = "", style }: { m: BrandModel; className?: string; style?: React.CSSProperties }) => (
  <img src={optimizedImage(m.image_url!, 1200)} alt={m.name} loading="eager" className={`object-contain ${className}`} style={style} />
);

const BrandStage = ({ brand, models, scene }: Props) => {
  const id = brandIdentity(brand.slug, brand.accent_color);
  const hero = flagshipOf(models);
  const frame = "relative w-full overflow-hidden h-[300px] sm:h-[380px] lg:h-[460px]";

  // Marque avec photo : on garde la photo, ENTIÈRE (retour Nolan 17/10 : le logo piecestrottinettes était rogné sur Kaabo).
  const photo = brand.hero_image_url || BRAND_PHOTOS[brand.slug];
  if (photo) {
    return (
      <div className="relative w-full overflow-hidden" style={{ clipPath: CHAMFER, background: CARBON }}>
        <img src={optimizedImage(photo, 1400)} alt={`${brand.name} — ${hero?.name ?? "trottinette"}`} className="block w-full h-auto max-h-[560px] object-contain" />
        <span aria-hidden className="absolute left-0 right-0 bottom-0 h-1.5" style={{ background: id.accent }} />
      </div>
    );
  }
  if (!hero) return null;
  const name = brand.name.toUpperCase();

  if (scene === 1) {
    return (
      <div className={frame} style={{ clipPath: CHAMFER, background: `radial-gradient(ellipse 60% 55% at 50% 45%, ${id.accent}66 0%, ${id.accent}14 45%, transparent 70%), linear-gradient(180deg, #232323 0%, #121212 100%)` }}>
        <div aria-hidden className="absolute inset-x-0 bottom-[16%] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }} />
        <div className="absolute inset-x-0 top-[6%] bottom-[16%] flex justify-center z-10">
          <Scooter m={hero} className="h-full w-auto max-w-[88%] drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]" />
        </div>
        {/* reflet au sol */}
        <div aria-hidden className="absolute inset-x-0 top-[84%] h-[78%] flex justify-center opacity-25" style={{ transform: "scaleY(-1)", WebkitMaskImage: "linear-gradient(to top, black, transparent 30%)", maskImage: "linear-gradient(to top, black, transparent 30%)" }}>
          <Scooter m={hero} className="h-full w-auto max-w-[88%]" />
        </div>
        <Caption m={hero} accent={id.accent} />
        <Signature />
      </div>
    );
  }

  if (scene === 2) {
    return (
      <div className={`${frame} lg:overflow-visible`} style={{ background: "transparent" }}>
        <div className="absolute inset-x-0 bottom-0 top-[14%] overflow-hidden" style={{ clipPath: CHAMFER, background: id.color ? id.accent : CARBON }}>
          <div aria-hidden className="absolute inset-0 flex items-center justify-center select-none whitespace-nowrap leading-none"
            style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", fontSize: `clamp(70px, ${Math.min(24, 150 / Math.max(name.length, 4))}vw, 260px)`, letterSpacing: "-0.05em", color: "transparent", WebkitTextStroke: `2px ${id.onAccent === "#FFFFFF" ? "rgba(255,255,255,0.35)" : "rgba(26,26,26,0.3)"}` }}>
            {name}
          </div>
          <Caption m={hero} light={id.onAccent === "#FFFFFF"} accent={id.onAccent === "#FFFFFF" ? "#fff" : CARBON} />
          <Signature light={id.onAccent === "#FFFFFF"} />
        </div>
        <div className="absolute inset-x-0 top-0 bottom-[12%] flex justify-center z-10 pointer-events-none">
          <Scooter m={hero} className="h-full w-auto max-w-[92%] drop-shadow-[0_28px_30px_rgba(0,0,0,0.45)]" />
        </div>
      </div>
    );
  }

  if (scene === 3) {
    return (
      <div className={frame} style={{ clipPath: CHAMFER, background: "linear-gradient(160deg, #262626 0%, #141414 100%)" }}>
        <div aria-hidden className="absolute -inset-x-10 top-[38%] h-[26%] -skew-y-[14deg]" style={{ background: id.accent }} />
        <div aria-hidden className="absolute -inset-x-10 top-[67%] h-[5%] -skew-y-[14deg]" style={{ background: id.accent, opacity: 0.55 }} />
        <div aria-hidden className="absolute -inset-x-10 top-[74%] h-[2%] -skew-y-[14deg] bg-white/40" />
        <div aria-hidden className="absolute left-4 top-3 text-sm uppercase tracking-[0.3em] text-white/50" style={{ fontFamily: FONT }}>{name} · racing</div>
        <div className="absolute inset-x-0 top-[5%] bottom-[14%] flex justify-center z-10">
          <Scooter m={hero} className="h-full w-auto max-w-[90%] drop-shadow-[0_26px_32px_rgba(0,0,0,0.65)]" />
        </div>
        <Caption m={hero} accent={id.accent} />
        <Signature />
      </div>
    );
  }

  if (scene === 4) {
    return (
      <div className={frame} style={{ clipPath: CHAMFER, background: "linear-gradient(180deg, #F3EFE7 0%, #FFFFFF 100%)", boxShadow: "inset 0 0 0 1px #E2DCD0" }}>
        <div aria-hidden className="absolute right-0 top-0 w-[38%] h-full" style={{ background: id.accent, clipPath: "polygon(35% 0, 100% 0, 100% 100%, 0 100%)" }} />
        <div className="absolute z-10" style={{ left: "-4%", bottom: "-6%", height: "175%", width: "108%", display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
          <Scooter m={hero} className="h-full w-auto drop-shadow-[0_30px_36px_rgba(0,0,0,0.3)]" />
        </div>
        <Caption m={hero} light={false} accent={id.accent} />
        <Signature light={id.onAccent === "#FFFFFF"} />
      </div>
    );
  }

  // 5 · FICHE TECH
  const specs = [
    hero.power_watts ? [`${hero.power_watts.toLocaleString("fr-FR")}`, "W"] : null,
    hero.max_speed_kmh ? [`${hero.max_speed_kmh}`, "km/h"] : null,
    hero.range_km ? [`${hero.range_km}`, "km"] : null,
  ].filter(Boolean) as [string, string][];
  return (
    <div className={frame} style={{ clipPath: CHAMFER, background: "#161616", backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "28px 28px" }}>
      <div className="absolute inset-y-[6%] left-0 right-[30%] sm:right-[26%] flex justify-center z-10">
        <Scooter m={hero} className="h-full w-auto max-w-full drop-shadow-[0_24px_30px_rgba(0,0,0,0.7)]" />
      </div>
      <div className="absolute right-3 top-0 bottom-14 flex flex-col justify-center gap-3 z-20">
        {specs.map(([v, u]) => (
          <div key={u} className="pl-3 pr-2 py-1.5 bg-black/40" style={{ boxShadow: `inset 3px 0 0 ${id.accent}` }}>
            <div className="text-xl sm:text-3xl leading-none text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{v}</div>
            <div className="text-sm uppercase tracking-[0.2em]" style={{ fontFamily: FONT, color: id.color ? id.accent : "#9FD3AE" }}>{u}</div>
          </div>
        ))}
      </div>
      <Caption m={hero} accent={id.accent} />
      <Signature />
    </div>
  );
};

export default BrandStage;
