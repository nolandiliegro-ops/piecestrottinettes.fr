/**
 * Image partagée de la carte Rider, composée à part de la carte affichée (25/10/2026, retour Nolan sur WhatsApp :
 * « on voit pas le profil, on voit pas la tête… c'est coupé »). WhatsApp ne montre dans la bulle que le CENTRE d'une
 * image haute (≈ 240 × 338, mesuré sur sa capture) : le pseudo et l'avatar, en haut de la story, sautaient.
 * Cadrages proposés derrière `?cadre=1..5` (0 = l'image d'avant, la carte elle-même).
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

export const CADRE_SIZE: Record<number, [number, number]> = { 1: [360, 640], 2: [360, 450], 3: [360, 640], 4: [360, 640], 5: [360, 360] };

interface Props {
  cadre: number;
  wallpaper?: string | null;
  avatar?: string | null;
  name: string;
  sub: string;
  /** Badge « Ambassadeur » sous le nom (25/10). */
  badge?: ReactNode;
  bio?: string | null;
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

const ModelLine = ({ m, center }: { m: RiderMachine | null; center?: boolean }) =>
  m?.model ? (
    <div className={center ? "text-center" : ""}>
      <p className="text-[19px] uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em" }}>{m.model.name}</p>
      <p className="mt-1 text-[13px] font-bold" style={{ color: m.is_owned ? SOFT : "#FFB4A0" }}>{m.is_owned ? (m.nickname ? `« ${m.nickname} »` : "À moi") : "Je kiffe"}</p>
    </div>
  ) : null;

const Url = ({ url }: { url: string }) => <p className="text-[12px] font-bold text-center tracking-wide" style={{ color: "rgba(255,255,255,0.75)" }}>{url}</p>;

const Head = ({ avatar, name, sub, bio, badge, size = 58 }: Pick<Props, "avatar" | "name" | "sub" | "bio" | "badge"> & { size?: number }) => (
  <div className="flex items-center gap-3">
    <Avatar url={avatar} name={name} size={size} />
    <div className="min-w-0">
      <p className="text-[22px] uppercase leading-none truncate" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em" }}>{name}</p>
      <p className="mt-1 text-[13px] font-semibold truncate" style={{ color: "#E7E7E7" }}>{sub}{bio ? ` · « ${bio.trim()} »` : ""}</p>
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

const StoryExport = forwardRef<HTMLDivElement, Props>(({ cadre, wallpaper, avatar, name, sub, badge, bio, current, mine, liked, publicUrl }, ref) => {
  const [w, h] = CADRE_SIZE[cadre] ?? CADRE_SIZE[1];
  const base = { width: w, height: h, background: CARBON, fontFamily: FONT, position: "fixed" as const, left: 0, top: 0, opacity: 0, pointerEvents: "none" as const, zIndex: -1 };

  // 1 · Centré : la même story, tout ce qui compte ramené dans la bande que WhatsApp montre (≈ 72 → 568 px).
  if (cadre === 1)
    return (
      <div ref={ref} className="relative overflow-hidden text-white" style={base}>
        <Wall url={wallpaper} shade="linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 14%, rgba(0,0,0,0.05) 34%, rgba(0,0,0,0.05) 46%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.92) 100%)" />
        <div className="absolute inset-x-0 flex flex-col gap-3 px-4" style={{ top: 78, bottom: 74 }}>
          <Head avatar={avatar} name={name} sub={sub} badge={badge} bio={bio} size={60} />
          <div className="flex-1 min-h-0 flex flex-col justify-end"><Trott m={current} h={210} /></div>
          <ModelLine m={current} />
          <Rows mine={mine} liked={liked} />
          <Url url={publicUrl} />
        </div>
      </div>
    );

  // 2 · Format 4:5 (1080 × 1350) : WhatsApp le montre presque entier, Insta le prend en post tel quel.
  if (cadre === 2)
    return (
      <div ref={ref} className="relative overflow-hidden text-white" style={base}>
        <Wall url={wallpaper} shade="linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 28%, rgba(0,0,0,0.05) 44%, rgba(0,0,0,0.9) 70%)" />
        <div className="absolute inset-0 flex flex-col gap-2.5 p-4 pb-3">
          <Head avatar={avatar} name={name} sub={sub} badge={badge} bio={bio} size={56} />
          <div className="flex-1 min-h-0 flex flex-col justify-end"><Trott m={current} h={160} /></div>
          <ModelLine m={current} />
          <Rows mine={mine} liked={liked} size={40} />
          <Url url={publicUrl} />
        </div>
      </div>
    );

  // 3 · Tête en grand : le rider d'abord — grand avatar centré, pseudo en gros, puis sa trott.
  if (cadre === 3)
    return (
      <div ref={ref} className="relative overflow-hidden text-white" style={base}>
        <Wall url={wallpaper} shade="linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.1) 46%, rgba(0,0,0,0.88) 70%, rgba(0,0,0,0.92) 100%)" />
        <div className="absolute inset-x-0 flex flex-col items-center gap-2 px-4" style={{ top: 92, bottom: 72 }}>
          <Avatar url={avatar} name={name} size={92} />
          <p className="mt-1 text-[28px] uppercase leading-none text-center" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em" }}>{name}</p>
          <p className="text-[13px] font-semibold text-center" style={{ color: "#E7E7E7" }}>{sub}</p>
          {badge}
          <div className="w-full flex-1 min-h-0 flex flex-col justify-end"><Trott m={current} h={160} /></div>
          <ModelLine m={current} center />
          <Rows mine={mine} liked={liked} />
          <Url url={publicUrl} />
        </div>
      </div>
    );

  // 4 · Carte posée : la carte en entier, posée au centre de la story sur le wallpaper assombri.
  if (cadre === 4)
    return (
      <div ref={ref} className="relative overflow-hidden text-white" style={base}>
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
    );

  // 5 · Carré (1080 × 1080) : affiché entier partout (WhatsApp, Messenger, Telegram).
  return (
    <div ref={ref} className="relative overflow-hidden text-white" style={base}>
      <Wall url={wallpaper} shade="linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.9) 66%)" />
      <div className="absolute inset-0 flex flex-col gap-2 p-3.5 pb-2.5">
        <Head avatar={avatar} name={name} sub={sub} badge={badge} size={50} />
        <div className="flex-1 min-h-0 flex flex-col justify-end"><Trott m={current} h={120} /></div>
        <ModelLine m={current} />
        <Rows mine={mine} liked={liked} size={34} label={56} />
        <Url url={publicUrl} />
      </div>
    </div>
  );
});
StoryExport.displayName = "StoryExport";

export default StoryExport;
