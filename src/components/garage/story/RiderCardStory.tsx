/**
 * Carte Rider « Story » (choix de Nolan, 25/10/2026 — lot claude/PT-lot-carte-rider-story.md).
 * Faite pour être partagée : le wallpaper du rider plein cadre, sa trott devant (toucher = la vraie photo),
 * « À moi » (5 max) bien séparé de « Je kiffe » (5 max), Respect, commentaires, Partager en image story.
 * Plus aucun chiffre (puissance, pièces montées, cartes holo) : ce n'est pas ce qui donne envie.
 */
import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { optimizedImage } from "@/lib/imageTransform"; // 25/10 poids 4G : vignettes 46 px servies en 120 px
import { Link } from "react-router-dom";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Heart, MessageSquare, Share2, Camera, X, Download } from "lucide-react";
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

/** Propositions du 25/10 soir (retour Nolan : « je veux que l'utilisateur voie exactement ce qu'il va avoir » et
 *  « un petit bouton pour voir le vrai modèle, bien rangé, bien intégré ») : `?apercu=1..5` = aperçu de l'image avant
 *  partage, `?photo=1..5` = bouton « vraie photo ». Défauts choisis le 25/10 : aperçu 1, photo 2 ; 0 = comportement d'avant. */
const readVariant = (key: string, fallback: number): number => {
  try { const v = new URLSearchParams(window.location.search).get(key); return v && /^[0-5]$/.test(v) ? Number(v) : fallback; } catch { return fallback; }
};

/** Attend que toutes les images de la carte soient chargées et décodées : sur ordinateur, le wallpaper et la trott ne
 *  sont montés qu'au moment de l'export (hors écran) ; sans cette attente, l'image partait vide (47 Ko, 25/10). */
const waitImages = async (node: HTMLElement) => {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(imgs.map((img) => {
    img.loading = "eager";
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((done) => {
      const end = () => done();
      img.addEventListener("load", end, { once: true });
      img.addEventListener("error", end, { once: true });
      window.setTimeout(end, 8000);
    });
  }));
  // decode() ne répond pas tant qu'aucune image n'est affichée (onglet en arrière-plan, appli quittée) : attente bornée à 2 s.
  await Promise.all(imgs.map((img) => Promise.race([
    img.decode ? img.decode().catch(() => undefined) : Promise.resolve(),
    new Promise<void>((done) => window.setTimeout(done, 2000)),
  ])));
};

const saveImage = (dataUrl: string, fileName: string) => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  a.click();
};

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
  /** Trott affichée, pilotée de l'extérieur (garage : la même trott est posée sur l'estrade). */
  selectedId?: string | null;
  onSelect?: (m: RiderMachine) => void;
  /** Ordinateur : le wallpaper est déjà derrière la page — la carte ne le répète pas (il revient dans l'image partagée). */
  bare?: boolean;
}

const RiderCardStory = ({ data, commentCount = 0, onOpenComments, className = "", selectedId, onSelect, bare = false }: Props) => {
  const { user } = useAuthContext();
  const like = useToggleCardLike();
  const { profile } = data;
  const { mine, liked } = useMemo(() => cardRows(data.machines), [data.machines]);
  const initial = mine.find((m) => m.is_featured) ?? mine[0] ?? liked[0] ?? null;
  const [currentId, setCurrentId] = useState<string | null>(initial?.id ?? null);
  const current = [...mine, ...liked].find((m) => m.id === (selectedId ?? currentId)) ?? initial;
  const [exporting, setExporting] = useState(false);
  const [real, setReal] = useState(false);
  const [sharing, setSharing] = useState(false);
  // Choix de Nolan du 25/10 soir : « 1 · Plein écran » et « 2 · Vignette » par défaut ; `?apercu=0` / `?photo=0` = avant.
  const [apercu] = useState(() => readVariant("apercu", 1));
  const [photoV] = useState(() => readVariant("photo", 2));
  const [preview, setPreview] = useState<{ url: string; file: File; w: number; h: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  // Ordinateur (bare) : la trott est sur l'estrade du wallpaper → la carte à l'écran est compacte, sans grande image.
  // L'image partagée, elle, est la carte complète (wallpaper + trott), rendue invisible le temps de l'export.
  const compact = bare && !exporting;
  const [holdH, setHoldH] = useState<number | null>(null);

  const level = getXPLevel(profile.performance_points ?? 0);
  const name = profile.display_name || "Rider";
  const sub = [level.name, profile.rider_location].filter(Boolean).join(" · ");
  const isMe = user?.id === profile.id;
  const publicUrl = profile.username ? `piecestrottinettes.fr/rider/${profile.username}` : "piecestrottinettes.fr";

  const choose = (m: RiderMachine) => { setCurrentId(m.id); setReal(false); onSelect?.(m); };

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : "https://piecestrottinettes.fr"}/rider/${profile.username ?? ""}`;

  /** Envoie le fichier (feuille de partage du téléphone), sinon l'enregistre. */
  const sendFile = async (file: File, dataUrl: string) => {
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    try {
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: `La carte Rider de ${name}`, url: shareUrl });
      } else {
        saveImage(dataUrl, file.name);
        toast.success("Carte enregistrée en image");
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") { saveImage(dataUrl, file.name); toast.success("Carte enregistrée en image"); }
    }
  };

  const share = async () => {
    if (!ref.current) return;
    setSharing(true);
    // Carte « nue » à l'écran : le wallpaper est remis le temps de l'image partagée.
    if (bare) { setHoldH(ref.current.offsetHeight); setExporting(true); await new Promise((r) => setTimeout(r, 60)); }
    try {
      const node = ref.current;
      await waitImages(node);
      // Format story : 1080 px de large (la hauteur suit la carte, ~1920 px).
      const opts = {
        pixelRatio: 1080 / node.offsetWidth,
        cacheBust: true,
        filter: (el: Node) => !(el instanceof HTMLElement && el.dataset.storyHide === "true"),
        // Ordinateur : la copie est posée en place mais invisible (opacité 0). Posée hors écran (left -10000), html-to-image
        // sortait une image vide d'une seule couleur (47 Ko, mesuré le 25/10) ; l'image partagée, elle, est remise visible.
        style: { position: "relative", left: "0", top: "0", margin: "0", opacity: "1", zIndex: "auto" },
      };
      // 1er rendu jeté : html-to-image n'embarque pas toujours les images au premier passage (Safari surtout).
      await toPng(node, opts).catch(() => null);
      const dataUrl = await toPng(node, opts);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `carte-rider-${profile.username ?? "rider"}.png`, { type: "image/png" });
      if (apercu > 0) {
        const probe = new Image();
        probe.src = dataUrl;
        await probe.decode().catch(() => undefined);
        setPreview({ url: dataUrl, file, w: probe.naturalWidth, h: probe.naturalHeight });
      }
      else await sendFile(file, dataUrl);
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast.error("Impossible de créer l'image de la carte");
    } finally {
      setExporting(false);
      setHoldH(null);
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
        {src && <img src={optimizedImage(src, 120)} alt="" crossOrigin="anonymous" loading="lazy" className="max-w-[88%] max-h-[88%] object-contain" />}
      </button>
    );
  };

  const btn = "min-h-[44px] px-3.5 inline-flex items-center gap-2 text-sm font-extrabold";

  /** Aperçu de l'image avant partage (propositions ?apercu=1..5) : c'est exactement ce fichier qui part. */
  const doShare = () => { if (preview) void sendFile(preview.file, preview.url); };
  const doSave = () => { if (preview) { saveImage(preview.url, preview.file.name); toast.success("Image enregistrée"); } };
  const previewActions = (dark: boolean) => (
    <div className="grid grid-cols-2 gap-2 w-full max-w-[360px]">
      <button type="button" onClick={doShare} className="min-h-[52px] px-3 inline-flex items-center justify-center gap-2 text-[15px] font-extrabold uppercase" style={{ background: dark ? "#FFFFFF" : CARBON, color: dark ? CARBON : "#FFFFFF", clipPath: ch(10), fontFamily: FONT }}>
        <Share2 className="w-[18px] h-[18px]" /> Partager
      </button>
      <button type="button" onClick={doSave} className="min-h-[52px] px-3 inline-flex items-center justify-center gap-2 text-[15px] font-extrabold uppercase" style={{ color: dark ? "#FFFFFF" : CARBON, boxShadow: `inset 0 0 0 2px ${dark ? "rgba(255,255,255,0.7)" : CARBON}`, fontFamily: FONT }}>
        <Download className="w-[18px] h-[18px]" /> Enregistrer
      </button>
    </div>
  );
  const closeBtn = (dark: boolean) => (
    <button type="button" onClick={() => setPreview(null)} aria-label="Fermer l'aperçu" className="absolute right-3 top-3 w-11 h-11 inline-flex items-center justify-center" style={{ background: dark ? "rgba(255,255,255,0.14)" : "#FFFFFF", color: dark ? "#FFFFFF" : CARBON, clipPath: ch(6) }}>
      <X className="w-5 h-5" />
    </button>
  );
  const big = (txt: string, dark: boolean) => (
    <p className="text-[24px] sm:text-[28px] uppercase leading-[0.95] text-center" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: dark ? "#FFFFFF" : CARBON }}>{txt}</p>
  );
  const previewOverlay = () => {
    if (!preview || apercu === 0 || apercu === 4 || typeof document === "undefined") return null;
    let body: JSX.Element;
    if (apercu === 1) {
      body = (
        <div role="dialog" aria-label="Aperçu de ta story" className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 p-4 overflow-y-auto" style={{ background: "rgba(10,10,10,0.92)", fontFamily: FONT }}>
          {closeBtn(true)}
          {big("Ta story est prête", true)}
          <p className="-mt-2 text-[15px] text-center" style={{ color: "rgba(255,255,255,0.72)" }}>C'est exactement l'image qui part.</p>
          <img src={preview.url} alt="Ta carte Rider en image" className="max-h-[62dvh] w-auto max-w-full" style={{ clipPath: ch(16) }} />
          {previewActions(true)}
        </div>
      );
    } else if (apercu === 2) {
      body = (
        <div role="dialog" aria-label="Aperçu de ta story" className="fixed inset-0 z-[90] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.55)", fontFamily: FONT }} onClick={() => setPreview(null)}>
          <div className="relative w-full max-w-[480px] bg-[#FAFAF8] px-4 pt-3 pb-5 grid justify-items-center gap-3" style={{ clipPath: "polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%)" }} onClick={(e) => e.stopPropagation()}>
            <span aria-hidden className="w-12 h-1.5 bg-[#D6D3CC]" />
            <div className="w-full flex items-center justify-between gap-3">
              <p className="text-[18px] uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>Ta carte, prête</p>
              <button type="button" onClick={() => setPreview(null)} aria-label="Fermer l'aperçu" className="w-11 h-11 inline-flex items-center justify-center" style={{ color: CARBON }}><X className="w-5 h-5" /></button>
            </div>
            <img src={preview.url} alt="Ta carte Rider en image" className="max-h-[52dvh] w-auto max-w-full" style={{ clipPath: ch(14) }} />
            <p className="text-sm text-center" style={{ color: "#4B5563" }}>L'image qui part, telle quelle.</p>
            {previewActions(false)}
          </div>
        </div>
      );
    } else if (apercu === 3) {
      body = (
        <div role="dialog" aria-label="Aperçu de ta story" className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 p-4 overflow-y-auto" style={{ background: "#121212", fontFamily: FONT }}>
          {closeBtn(true)}
          <div className="relative w-[min(290px,66vw)] max-h-[64dvh] aspect-[9/16] p-[6px] bg-black" style={{ clipPath: ch(20), boxShadow: "0 0 0 1px #333" }}>
            <img src={preview.url} alt="Ta carte Rider en image" className="w-full h-full object-cover" style={{ clipPath: ch(16) }} />
            <div aria-hidden className="absolute left-3 right-3 top-3 flex gap-1">
              <span className="h-[3px] flex-1 bg-white" /><span className="h-[3px] flex-1 bg-white/40" /><span className="h-[3px] flex-1 bg-white/40" />
            </div>
          </div>
          <p className="text-[15px] font-semibold text-center" style={{ color: "rgba(255,255,255,0.8)" }}>Voilà ce que tes potes verront en story.</p>
          {previewActions(true)}
        </div>
      );
    } else {
      body = (
        <div role="dialog" aria-label="Aperçu de ta story" className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 p-4 overflow-y-auto" style={{ background: "#E9E4DA", fontFamily: FONT }}>
          {closeBtn(false)}
          {big("Ton tirage est prêt", false)}
          <div className="bg-white p-[10px] pb-3" style={{ transform: "rotate(-2deg)", boxShadow: "0 22px 40px -12px rgba(0,0,0,0.45)" }}>
            <img src={preview.url} alt="Ta carte Rider en image" className="block max-h-[54dvh] w-auto max-w-[78vw]" />
            <p className="mt-2 text-sm font-semibold text-center" style={{ color: "#6B7280" }}>{preview.file.name} · {preview.w} × {preview.h} px</p>
          </div>
          {previewActions(false)}
        </div>
      );
    }
    return createPortal(body, document.body);
  };

  /** Accès à la vraie photo de la trott (propositions ?photo=1..5). `place` : « scene » = sur la grande image,
   *  « name » = sous le nom (carte compacte sur ordinateur, ou variantes Bascule / Lien partout). */
  const photoEl = (place: "scene" | "name") => {
    const photo = current?.custom_photo_url;
    if (!photo) return null;
    const open = () => setReal(true);
    const label = "Voir la vraie photo";
    const v = photoV;
    if (place === "scene") {
      if (!current?.model?.image_url || compact) return null;
      if (v === 0) return (
        <button type="button" data-story-hide="true" onClick={open} className="absolute right-3.5 bottom-2 min-h-[44px] px-3 inline-flex items-center gap-2 bg-white text-sm font-extrabold" style={{ color: CARBON, clipPath: ch(6) }}>
          <Camera className="w-4 h-4" /> {label}
        </button>
      );
      if (v === 1) return (
        <button type="button" data-story-hide="true" onClick={open} aria-label={label} className="absolute right-3 top-1 w-11 h-11 inline-flex items-center justify-center" style={{ background: "rgba(26,26,26,0.82)", color: "#FFFFFF", clipPath: ch(6) }}>
          <Camera className="w-5 h-5" />
        </button>
      );
      if (v === 2) return (
        <button type="button" data-story-hide="true" onClick={open} aria-label={label} className="absolute right-3 bottom-2 w-[58px] h-[58px] p-[2px] bg-white" style={{ clipPath: ch(8) }}>
          <img src={photo} alt="" crossOrigin="anonymous" className="w-full h-full object-cover" style={{ clipPath: ch(7) }} />
          <span className="absolute left-[2px] bottom-[2px] w-6 h-6 inline-flex items-center justify-center" style={{ background: CARBON }}><Camera className="w-3.5 h-3.5 text-white" /></span>
        </button>
      );
      if (v === 5) return (
        <button type="button" data-story-hide="true" onClick={open} aria-label={label} className="absolute right-0 bottom-0 w-[76px] h-[76px]">
          <span className="absolute inset-0" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)", background: `url(${photo}) center/cover` }} />
          <span className="absolute inset-0" style={{ clipPath: "polygon(100% 0, 100% 6%, 6% 100%, 0 100%)", background: "#FFFFFF" }} />
          <span className="absolute right-1.5 bottom-1.5 w-7 h-7 inline-flex items-center justify-center bg-white" style={{ clipPath: ch(4) }}><Camera className="w-4 h-4" style={{ color: CARBON }} /></span>
        </button>
      );
      return null; // 3 et 4 : sous le nom
    }
    // place === "name"
    if (v === 3) return (
      <div data-story-hide="true" className="mt-2 inline-flex" style={{ background: "rgba(255,255,255,0.14)", clipPath: ch(6) }}>
        <span className="min-h-[44px] px-3.5 inline-flex items-center text-sm font-extrabold bg-white" style={{ color: CARBON, clipPath: ch(6) }}>Modèle</span>
        <button type="button" onClick={open} className="min-h-[44px] px-3.5 inline-flex items-center gap-1.5 text-sm font-extrabold text-white"><Camera className="w-4 h-4" /> Ma photo</button>
      </div>
    );
    if (v === 4) return (
      <button type="button" data-story-hide="true" onClick={open} className="min-h-[44px] -mb-2 inline-flex items-center gap-1.5 text-sm font-bold underline underline-offset-4" style={{ color: SOFT }}>
        <Camera className="w-4 h-4" /> {label}
      </button>
    );
    if (!compact) return null;
    if (v === 0) return (
      <button type="button" onClick={open} className="mt-2 min-h-[44px] px-3 inline-flex items-center gap-2 bg-white text-sm font-extrabold" style={{ color: CARBON, clipPath: ch(6) }}>
        <Camera className="w-4 h-4" /> {label}
      </button>
    );
    if (v === 1) return (
      <button type="button" onClick={open} aria-label={label} className="absolute right-0 top-0 w-11 h-11 inline-flex items-center justify-center bg-white" style={{ color: CARBON, clipPath: ch(6) }}>
        <Camera className="w-5 h-5" />
      </button>
    );
    if (v === 2) return (
      <button type="button" onClick={open} aria-label={label} className="absolute right-0 top-0 w-[52px] h-[52px] p-[2px] bg-white" style={{ clipPath: ch(7) }}>
        <img src={photo} alt="" crossOrigin="anonymous" className="w-full h-full object-cover" style={{ clipPath: ch(6) }} />
        <span className="absolute left-[2px] bottom-[2px] w-5 h-5 inline-flex items-center justify-center" style={{ background: CARBON }}><Camera className="w-3 h-3 text-white" /></span>
      </button>
    );
    if (v === 5) return (
      <button type="button" onClick={open} aria-label={label} className="absolute -right-4 -top-1 w-[64px] h-[56px]">
        <span className="absolute inset-0" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 0)", background: `url(${photo}) center/cover` }} />
        <span className="absolute inset-0" style={{ clipPath: "polygon(0 0, 7% 0, 100% 93%, 100% 100%)", background: "#FFFFFF" }} />
        <span className="absolute right-1.5 top-1.5 w-6 h-6 inline-flex items-center justify-center bg-white" style={{ clipPath: ch(4) }}><Camera className="w-3.5 h-3.5" style={{ color: CARBON }} /></span>
      </button>
    );
    return null;
  };

  // 4 · « Sur la carte » : l'image remplace la carte, à sa place, le temps de partager.
  if (preview && apercu === 4) {
    return (
      <div className={`w-full max-w-[360px] grid gap-3 ${className}`} style={{ fontFamily: FONT }}>
        <span className="justify-self-start px-2.5 py-1 text-sm font-extrabold uppercase tracking-wide text-white" style={{ background: "#4A7C59", clipPath: ch(5) }}>Aperçu · l'image qui part</span>
        <img src={preview.url} alt="Ta carte Rider en image" className="block w-full h-auto" style={{ clipPath: ch(22) }} />
        <div className="p-2.5 grid gap-1 justify-items-center" style={{ background: "rgba(26,26,26,0.82)", clipPath: ch(12) }}>
          {previewActions(true)}
          <button type="button" onClick={() => setPreview(null)} className="min-h-[44px] text-[15px] font-bold underline underline-offset-4 text-white">Revenir à ma carte</button>
        </div>
      </div>
    );
  }

  return (
    <>
    {previewOverlay()}
    {bare && exporting && holdH != null && <div aria-hidden className="w-full max-w-[360px]" style={{ height: holdH }} />}
    <div
      ref={ref}
      className={`relative w-full max-w-[360px] ${compact ? "" : "min-h-[640px]"} overflow-hidden flex flex-col text-white ${className}`}
      style={{ background: CARBON, clipPath: ch(22), fontFamily: FONT, ...(bare && exporting ? { position: "fixed", left: 0, top: 0, width: 360, opacity: 0, pointerEvents: "none", zIndex: -1 } : {}) }}
    >
      {/* Le wallpaper du rider, plein cadre */}
      {data.wallpaper_url && (!bare || exporting) && (
        <img src={data.wallpaper_url} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {!compact && <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.88) 74%)" }} />}

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

      {/* La trott (en compact sur ordinateur, elle est sur l'estrade : la carte ne la répète pas) */}
      {(!compact || !current) && (
      <div className={`relative flex-1 ${compact ? "py-6" : "min-h-[250px]"} flex items-center justify-center`}>
        {/* Carte vide (nouveau rider) : une invitation, pas un trou */}
        {!current && (
          isMe ? (
            <Link to="/trottinettes" data-story-hide="true" className="mx-6 px-5 py-4 grid gap-1 text-center bg-white" style={{ clipPath: ch(10), color: CARBON }}>
              <span className="text-[17px] uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>Ajoute ta trott</span>
              <span className="text-sm font-semibold" style={{ color: "#4B5563" }}>Elle s'affichera ici, sur ton wallpaper.</span>
            </Link>
          ) : (
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>Pas encore de trott dans ce garage.</p>
          )
        )}
        {imgOf(current) && (current?.custom_photo_url && current.model?.image_url ? (
          <button type="button" onClick={() => setReal(true)} aria-label="Voir la vraie photo" className="w-[76%] flex justify-center">
            <img src={optimizedImage(imgOf(current)!, 900)} alt={current?.model?.name ?? ""} crossOrigin="anonymous" className="w-full max-h-[300px] object-contain" style={{ filter: "drop-shadow(0 18px 22px rgba(0,0,0,0.55))" }} />
          </button>
        ) : (
          <img src={optimizedImage(imgOf(current)!, 900)} alt={current?.model?.name ?? ""} crossOrigin="anonymous" className="w-[76%] max-h-[300px] object-contain" style={{ filter: "drop-shadow(0 18px 22px rgba(0,0,0,0.55))" }} />
        ))}
        {photoEl("scene")}
      </div>
      )}

      {/* Nom, rangées, actions */}
      <div className="relative px-4 pb-3 grid gap-2.5">
        {current?.model && (
          <div className="relative">
            <p className={`text-[20px] uppercase leading-none ${compact && current.custom_photo_url && [1, 2, 5].includes(photoV) ? "pr-[60px]" : ""}`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em" }}>{current.model.name}</p>
            <p className="mt-1 text-sm font-bold" style={{ color: current.is_owned ? SOFT : "#FFB4A0" }}>
              {current.is_owned ? (current.nickname ? `« ${current.nickname} »` : "À moi") : "Je kiffe"}
            </p>
            {photoEl("name")}
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
    </>
  );
};

export default RiderCardStory;
