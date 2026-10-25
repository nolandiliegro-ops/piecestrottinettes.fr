/**
 * Image partagée de la carte Rider, composée à part de la carte affichée (25/10/2026, retour Nolan sur WhatsApp :
 * « on voit pas le profil, on voit pas la tête… c'est coupé »). WhatsApp ne montre dans la bulle que le CENTRE d'une
 * image haute (≈ 240 × 338, mesuré sur sa capture) : le pseudo et l'avatar, en haut de la story, sautaient.
 * Cadrage retenu (5 propositions, validé sur le téléphone de Nolan le 26/10) : « Carte posée » — la carte entière au
 * centre de la story ; la bulle WhatsApp la montre en entier, tête comprise. `?cadre=0` = l'image d'avant (la carte elle-même).
 * Rendu invisible (opacité 0) le temps de l'export, 360 px de large → 1080 px.
 */
import { forwardRef, type ReactNode } from "react";
import { optimizedImage } from "@/lib/imageTransform";
import type { RiderMachine } from "@/hooks/useRiderCardData";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const SOFT = "#8FBF9C";
const LIKE_BG = "#F1D9CC";
const ch = (c: number) => `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;
const imgOf = (m?: RiderMachine | null) => m?.model?.image_url ?? m?.custom_photo_url ?? null;

interface Props {
  wallpaper?: string | null;
  avatar?: string | null;
  name: string;
  sub: string;
  /** Badge « Ambassadeur » sous le nom (25/10). */
  badge?: ReactNode;
  current: RiderMachine | null;
  mine: RiderMachine[];
  liked: RiderMachine[];
  publicUrl: string;
}

const Avatar = ({ url, name, size }: { url?: string | null; name: string; size: number }) =>
  url ? (
    <img src={url} alt="" crossOrigin="anonymous" className="object-cover bg-white shrink-0" style={{ width: size, height: size, clipPath: ch(Math.round(size / 6.5)) }} />
  ) : (
    <span className="shrink-0 inline-flex items-center justify-center bg-white font-black" style={{ width: size, height: size, fontSize: size * 0.42, clipPath: ch(Math.round(size / 6.5)), color: CARBON, fontFamily: UNB }}>{name.slice(0, 1).toUpperCase()}</span>
  );

const Trott = ({ m, h }: { m: RiderMachine | null; h: number }) => {
  const src = imgOf(m);
  return (
    <div className="relative flex items-end justify-center" style={{ height: h }}>
      <span aria-hidden className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[56%] h-[12px] rounded-[50%]" style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0))" }} />
      {src && <img src={optimizedImage(src, 900)} alt="" crossOrigin="anonymous" className="relative max-h-full max-w-[80%] object-contain" style={{ filter: "drop-shadow(0 14px 16px rgba(0,0,0,0.5))" }} />}
    </div>
  );
};

const Tiles = ({ list, liked, size }: { list: RiderMachine[]; liked?: boolean; size: number }) => (
  <div className="flex gap-1.5">
    {list.map((m) => {
      const src = imgOf(m);
      return (
        <span key={m.id} className="inline-flex items-center justify-center shrink-0" style={{ width: size, height: size, background: liked ? LIKE_BG : "#FFFFFF", clipPath: ch(5) }}>
          {src && <img src={optimizedImage(src, 120)} alt="" crossOrigin="anonymous" className="max-w-[88%] max-h-[88%] object-contain" />}
        </span>
      );
    })}
  </div>
);

const Rows = ({ mine, liked, size = 42, label = 62 }: { mine: RiderMachine[]; liked: RiderMachine[]; size?: number; label?: number }) => (
  <div className="grid gap-1.5">
    {mine.length > 0 && (
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 text-[13px] font-extrabold uppercase tracking-wide" style={{ width: label }}>À moi</span>
        <Tiles list={mine} size={size} />
      </div>
    )}
    {liked.length > 0 && (
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 text-[13px] font-extrabold uppercase tracking-wide" style={{ width: label, color: "#FFB4A0" }}>Je kiffe</span>
        <Tiles list={liked} liked size={size} />
      </div>
    )}
  </div>
);

const ModelLine = ({ m }: { m: RiderMachine | null }) =>
  m?.model ? (
    <div>
      <p className="text-[19px] uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em" }}>{m.model.name}</p>
      <p className="mt-1 text-[13px] font-bold" style={{ color: m.is_owned ? SOFT : "#FFB4A0" }}>{m.is_owned ? (m.nickname ? `« ${m.nickname} »` : "À moi") : "Je kiffe"}</p>
    </div>
  ) : null;

const Url = ({ url }: { url: string }) => <p className="text-[12px] font-bold text-center tracking-wide" style={{ color: "rgba(255,255,255,0.75)" }}>{url}</p>;

const Head = ({ avatar, name, sub, badge, size = 58 }: Pick<Props, "avatar" | "name" | "sub" | "badge"> & { size?: number }) => (
  <div className="flex items-center gap-3">
    <Avatar url={avatar} name={name} size={size} />
    <div className="min-w-0">
      <p className="text-[22px] uppercase leading-none truncate" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em" }}>{name}</p>
      <p className="mt-1 text-[13px] font-semibold truncate" style={{ color: "#E7E7E7" }}>{sub}</p>
      {badge}
    </div>
  </div>
);

const Wall = ({ url, shade }: { url?: string | null; shade: string }) => (
  <>
    {url && <img src={url} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" />}
    <div aria-hidden className="absolute inset-0" style={{ background: shade }} />
  </>
);

const StoryExport = forwardRef<HTMLDivElement, Props>(({ wallpaper, avatar, name, sub, badge, current, mine, liked, publicUrl }, ref) => (
  <div ref={ref} className="relative overflow-hidden text-white" style={{ width: 360, height: 640, background: CARBON, fontFamily: FONT, position: "fixed", left: 0, top: 0, opacity: 0, pointerEvents: "none", zIndex: -1 }}>
    <Wall url={wallpaper} shade="rgba(10,10,10,0.62)" />
    <p className="absolute inset-x-0 text-center text-[13px] font-extrabold uppercase tracking-[0.2em]" style={{ top: 40, color: SOFT }}>Carte Rider</p>
    <div className="absolute overflow-hidden" style={{ left: 22, right: 22, top: 74, bottom: 92, clipPath: ch(18), boxShadow: "0 0 0 1px rgba(255,255,255,0.2)" }}>
      <Wall url={wallpaper} shade="linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 26%, rgba(0,0,0,0.05) 44%, rgba(0,0,0,0.9) 72%)" />
      <div className="absolute inset-0 flex flex-col gap-2.5 p-3.5">
        <Head avatar={avatar} name={name} sub={sub} badge={badge} size={64} />
        <div className="flex-1 min-h-0 flex flex-col justify-end"><Trott m={current} h={190} /></div>
        <ModelLine m={current} />
        <Rows mine={mine} liked={liked} size={36} label={56} />
      </div>
    </div>
    <div className="absolute inset-x-0" style={{ top: 560 }}><Url url={publicUrl} /></div>
  </div>
));
StoryExport.displayName = "StoryExport";

export default StoryExport;
