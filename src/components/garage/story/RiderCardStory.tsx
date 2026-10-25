/**
 * Carte Rider « Story » (choix de Nolan, 25/10/2026 — lot claude/PT-lot-carte-rider-story.md).
 * Faite pour être partagée : le wallpaper du rider plein cadre, sa trott devant (toucher = la vraie photo),
 * « À moi » (5 max) bien séparé de « Je kiffe » (5 max), Respect, commentaires, Partager en image story.
 * Plus aucun chiffre (puissance, pièces montées, cartes holo) : ce n'est pas ce qui donne envie.
 */
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Heart, MessageSquare, Share2, Camera, X } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { getXPLevel } from "@/lib/xpLevels";
import { useToggleCardLike, type RiderCardData, type RiderMachine } from "@/hooks/useRiderCardData";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const SOFT = "#8FBF9C";
const LIKE_BG = "#F1D9CC";
const ch = (c: number) => `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;

const imgOf = (m?: RiderMachine | null) => m?.model?.image_url ?? m?.custom_photo_url ?? null;

/** Les 5 « à moi » et les 5 « je kiffe » affichés : ceux que le rider a mis sur sa carte, sinon les plus récents. */
export const cardRows = (machines: RiderMachine[]) => {
  const pick = (owned: boolean) => {
    const group = machines.filter((m) => m.model && m.is_owned === owned);
    const slotted = group.filter((m) => m.card_slot != null).sort((a, b) => (a.card_slot ?? 9) - (b.card_slot ?? 9));
    return (slotted.length ? slotted : group).slice(0, 5);
  };
  return { mine: pick(true), liked: pick(false) };
};

interface Props {
  data: RiderCardData;
  commentCount?: number;
  /** Ouvre le fil de commentaires. Sans handler, le bouton mène au garage public. */
  onOpenComments?: () => void;
  className?: string;
}

const RiderCardStory = ({ data, commentCount = 0, onOpenComments, className = "" }: Props) => {
  const { user } = useAuthContext();
  const like = useToggleCardLike();
  const { profile } = data;
  const { mine, liked } = useMemo(() => cardRows(data.machines), [data.machines]);
  const initial = mine.find((m) => m.is_featured) ?? mine[0] ?? liked[0] ?? null;
  const [currentId, setCurrentId] = useState<string | null>(initial?.id ?? null);
  const current = [...mine, ...liked].find((m) => m.id === currentId) ?? initial;
  const [real, setReal] = useState(false);
  const [sharing, setSharing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const level = getXPLevel(profile.performance_points ?? 0);
  const name = profile.display_name || "Rider";
  const sub = [level.name, profile.rider_location].filter(Boolean).join(" · ");
  const isMe = user?.id === profile.id;
  const publicUrl = profile.username ? `piecestrottinettes.fr/rider/${profile.username}` : "piecestrottinettes.fr";

  const choose = (m: RiderMachine) => { setCurrentId(m.id); setReal(false); };

  const share = async () => {
    if (!ref.current) return;
    setSharing(true);
    try {
      const node = ref.current;
      // Format story : 1080 px de large (la hauteur suit la carte, ~1920 px).
      const dataUrl = await toPng(node, {
        pixelRatio: 1080 / node.offsetWidth,
        cacheBust: true,
        filter: (el) => !(el instanceof HTMLElement && el.dataset.storyHide === "true"),
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `carte-rider-${profile.username ?? "rider"}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      const url = `${window.location.origin}/rider/${profile.username ?? ""}`;
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: `La carte Rider de ${name}`, url });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = file.name;
        a.click();
        toast.success("Carte enregistrée en image");
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast.error("Impossible de créer l'image de la carte");
    } finally {
      setSharing(false);
    }
  };

  const Tile = ({ m, likedRow }: { m: RiderMachine; likedRow?: boolean }) => {
    const on = current?.id === m.id;
    const src = imgOf(m);
    return (
      <button
        type="button"
        onClick={() => choose(m)}
        aria-pressed={on}
        aria-label={`${m.nickname ? `${m.nickname} — ` : ""}${m.model?.name ?? "trottinette"}`}
        className="relative w-[46px] h-[46px] shrink-0 inline-flex items-center justify-center"
        style={{ background: likedRow ? LIKE_BG : "#FFFFFF", clipPath: ch(6), boxShadow: on ? `inset 0 0 0 3px ${likedRow ? "#C2410C" : SOFT}` : undefined }}
      >
        {src && <img src={src} alt="" crossOrigin="anonymous" loading="lazy" className="max-w-[88%] max-h-[88%] object-contain" />}
      </button>
    );
  };

  const btn = "min-h-[44px] px-3.5 inline-flex items-center gap-2 text-sm font-extrabold";

  return (
    <div
      ref={ref}
      className={`relative w-full max-w-[360px] min-h-[640px] overflow-hidden flex flex-col text-white ${className}`}
      style={{ background: CARBON, clipPath: ch(22), fontFamily: FONT }}
    >
      {/* Le wallpaper du rider, plein cadre */}
      {data.wallpaper_url && (
        <img src={data.wallpaper_url} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.88) 74%)" }} />

      {/* Qui */}
      <div className="relative flex items-center gap-3 p-4">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" crossOrigin="anonymous" className="w-[52px] h-[52px] object-cover bg-white shrink-0" style={{ clipPath: ch(8) }} />
        ) : (
          <span className="w-[52px] h-[52px] shrink-0 inline-flex items-center justify-center bg-white text-lg font-black" style={{ clipPath: ch(8), color: CARBON, fontFamily: UNB }}>{name.slice(0, 1).toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <p className="text-[22px] uppercase leading-none truncate" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em" }}>{name}</p>
          <p className="mt-1 text-sm font-semibold truncate" style={{ color: "#E7E7E7" }}>{sub}{profile.bio ? ` · « ${profile.bio.trim()} »` : ""}</p>
        </div>
      </div>

      {/* La trott */}
      <div className="relative flex-1 min-h-[250px] flex items-center justify-center">
        {imgOf(current) && (current?.custom_photo_url && current.model?.image_url ? (
          <button type="button" onClick={() => setReal(true)} aria-label="Voir la vraie photo" className="w-[76%] flex justify-center">
            <img src={imgOf(current)!} alt={current?.model?.name ?? ""} crossOrigin="anonymous" className="w-full max-h-[300px] object-contain" style={{ filter: "drop-shadow(0 18px 22px rgba(0,0,0,0.55))" }} />
          </button>
        ) : (
          <img src={imgOf(current)!} alt={current?.model?.name ?? ""} crossOrigin="anonymous" className="w-[76%] max-h-[300px] object-contain" style={{ filter: "drop-shadow(0 18px 22px rgba(0,0,0,0.55))" }} />
        ))}
        {current?.custom_photo_url && current.model?.image_url && (
          <button type="button" data-story-hide="true" onClick={() => setReal(true)} className="absolute right-3.5 bottom-2 min-h-[44px] px-3 inline-flex items-center gap-2 bg-white text-sm font-extrabold" style={{ color: CARBON, clipPath: ch(6) }}>
            <Camera className="w-4 h-4" /> Voir la vraie photo
          </button>
        )}
      </div>

      {/* Nom, rangées, actions */}
      <div className="relative px-4 pb-3 grid gap-2.5">
        {current?.model && (
          <div>
            <p className="text-[20px] uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em" }}>{current.model.name}</p>
            <p className="mt-1 text-sm font-bold" style={{ color: current.is_owned ? SOFT : "#FFB4A0" }}>
              {current.is_owned ? (current.nickname ? `« ${current.nickname} »` : "À moi") : "Je kiffe"}
            </p>
          </div>
        )}
        {mine.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-[66px] shrink-0 text-sm font-extrabold uppercase tracking-wide">À moi</span>
            {mine.map((m) => <Tile key={m.id} m={m} />)}
          </div>
        )}
        {liked.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-[66px] shrink-0 text-sm font-extrabold uppercase tracking-wide" style={{ color: "#FFB4A0" }}>Je kiffe</span>
            {liked.map((m) => <Tile key={m.id} m={m} likedRow />)}
          </div>
        )}
        <div className="flex gap-2" data-story-hide="true">
          <button
            type="button"
            onClick={() => (user ? (isMe ? toast.info("Ce sont les autres riders qui te donnent du respect") : like.mutate({ ownerId: profile.id, liked: data.likedByMe })) : toast.info("Connecte-toi pour donner du respect"))}
            aria-pressed={data.likedByMe}
            className={btn}
            style={{ background: data.likedByMe ? "#FFFFFF" : "rgba(255,255,255,0.14)", color: data.likedByMe ? CARBON : "#FFFFFF", clipPath: ch(8) }}
          >
            <Heart className="w-4 h-4" fill={data.likedByMe ? "currentColor" : "none"} /> Respect {data.likes}
          </button>
          {onOpenComments ? (
            <button type="button" onClick={onOpenComments} className={btn} style={{ background: "rgba(255,255,255,0.14)", clipPath: ch(8) }} aria-label={`${commentCount} commentaire${commentCount > 1 ? "s" : ""}`}>
              <MessageSquare className="w-4 h-4" /> {commentCount}
            </button>
          ) : (
            <Link to={`/rider/${profile.username ?? ""}`} className={btn} style={{ background: "rgba(255,255,255,0.14)", clipPath: ch(8) }} aria-label="Voir les commentaires">
              <MessageSquare className="w-4 h-4" /> {commentCount}
            </Link>
          )}
          <button type="button" onClick={share} disabled={sharing} className={`${btn} ml-auto bg-white disabled:opacity-60`} style={{ color: CARBON, clipPath: ch(8) }}>
            <Share2 className="w-4 h-4" /> {sharing ? "…" : "Partager"}
          </button>
        </div>
        <p className="text-sm font-semibold text-center" style={{ color: "rgba(255,255,255,0.6)" }}>{publicUrl}</p>
      </div>

      {/* La vraie photo, plein cadre */}
      {real && current?.custom_photo_url && (
        <div className="absolute inset-0 z-20">
          <img src={current.custom_photo_url} alt={`Photo de ${name}`} crossOrigin="anonymous" className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 p-4" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.85), transparent)" }}>
            <p className="text-[20px] uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{current.nickname || current.model?.name}</p>
            <p className="mt-1 text-sm font-semibold" style={{ color: "#DDDDDD" }}>Photo de {name} · {current.model?.name}</p>
          </div>
          <button type="button" data-story-hide="true" onClick={() => setReal(false)} aria-label="Revenir à la carte" className="absolute top-3 right-3 w-11 h-11 inline-flex items-center justify-center bg-white" style={{ color: CARBON, clipPath: ch(6) }}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default RiderCardStory;
