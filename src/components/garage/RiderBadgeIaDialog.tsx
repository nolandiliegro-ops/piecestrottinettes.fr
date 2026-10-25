import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Camera, ImagePlus, Loader2, Sparkles, Check, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/* Badge rider IA (25/10/2026) — doc claude/PT-lot-avatar-ia.md.
   Selfie → recadrage carré → fonction generate-rider-avatar (2 propositions, Gemini) → le pseudo est posé ICI
   sur le badge choisi (canvas), puis enregistré comme photo de profil (même chemin que l'upload classique).
   Le selfie n'est jamais stocké ; les propositions non choisies non plus. */

type Tenue = "casque" | "lunettes" | "naturel";
const TENUES: { k: Tenue; label: string }[] = [
  { k: "casque", label: "Casque + lunettes" },
  { k: "lunettes", label: "Lunettes" },
  { k: "naturel", label: "Tête nue" },
];

const charger = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });

/** Selfie recadré → JPEG 768 px en data URL (assez pour un visage, léger à envoyer). */
async function selfieRecadre(src: string, crop: Area): Promise<string> {
  const img = await charger(src);
  const c = document.createElement("canvas");
  c.width = c.height = 768;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, 768, 768);
  return c.toDataURL("image/jpeg", 0.88);
}

/** Pose le pseudo en bas du badge, dans le style de n0n0.ride (blanc, contour sombre, italique gras). */
export async function badgeAvecPseudo(src: string, pseudo: string, taille = 512): Promise<HTMLCanvasElement> {
  const img = await charger(src);
  const c = document.createElement("canvas");
  c.width = c.height = taille;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, taille, taille);
  ctx.drawImage(img, 0, 0, taille, taille);
  const texte = pseudo.trim().slice(0, 18);
  if (texte) {
    let fs = Math.round(taille * 0.12);
    const police = (f: number) => `italic 900 ${f}px "Arial Black", Arial, sans-serif`;
    ctx.font = police(fs);
    while (ctx.measureText(texte).width > taille * 0.66 && fs > 18) { fs -= 2; ctx.font = police(fs); }
    const y = taille * 0.86;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(4, fs * 0.2);
    ctx.strokeStyle = "#1A1A1A";
    ctx.strokeText(texte, taille / 2, y);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(texte, taille / 2, y);
  }
  return c;
}

async function lireErreur(error: unknown): Promise<{ message: string; code?: string }> {
  // supabase-js : le corps JSON de la réponse non-2xx est dans error.context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = (error as any)?.context;
  try {
    const j = typeof ctx?.json === "function" ? await ctx.json() : null;
    if (j?.error) return { message: j.error, code: j.code };
  } catch { /* ignore */ }
  return { message: (error as Error)?.message ?? "Erreur inconnue" };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const btn = "inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-lg font-semibold text-base";

const RiderBadgeIaDialog = ({ open, onOpenChange }: Props) => {
  const { user, profile, refreshProfile } = useAuth();
  const pseudo = profile?.display_name || "";
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [zone, setZone] = useState<Area | null>(null);
  const [tenue, setTenue] = useState<Tenue>("casque");
  const [accord, setAccord] = useState(false);
  const [etape, setEtape] = useState<"photo" | "attente" | "choix">("photo");
  const [badges, setBadges] = useState<string[]>([]);
  const [choisi, setChoisi] = useState(0);
  const [restants, setRestants] = useState<number | null>(null);
  const [enregistre, setEnregistre] = useState(false);

  const reset = () => {
    setSrc(null); setCrop({ x: 0, y: 0 }); setZoom(1); setZone(null);
    setEtape("photo"); setBadges([]); setChoisi(0); setAccord(false);
  };

  const prendre = (f?: File) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type) && !f.type.startsWith("image/")) return toast.error("Choisis une photo");
    if (f.size > 15 * 1024 * 1024) return toast.error("Photo trop lourde (15 Mo max)");
    const r = new FileReader();
    r.onload = () => setSrc(r.result as string);
    r.readAsDataURL(f);
  };

  const onCrop = useCallback((_: Area, px: Area) => setZone(px), []);

  const creer = async () => {
    if (!src || !zone || !accord) return;
    setEtape("attente");
    try {
      const image = await selfieRecadre(src, zone);
      const { data, error } = await supabase.functions.invoke("generate-rider-avatar", {
        body: { action: "generer", image, tenue, accord: true },
      });
      if (error) {
        const e = await lireErreur(error);
        toast.error(e.code === "non_branche" ? "Le badge IA arrive très bientôt !" : e.message);
        setEtape("photo");
        return;
      }
      const sorties: string[] = await Promise.all(
        (data?.images ?? []).map(async (s: string) => (await badgeAvecPseudo(s, pseudo, 768)).toDataURL("image/png")),
      );
      setRestants(data?.restants ?? null);
      setBadges(sorties);
      setChoisi(0);
      setEtape("choix");
    } catch (e) {
      toast.error((e as Error).message || "La création a échoué");
      setEtape("photo");
    }
  };

  const garder = async () => {
    if (!user || !badges[choisi]) return;
    setEnregistre(true);
    try {
      const c = await badgeAvecPseudo(badges[choisi], "", 512); // le pseudo est déjà sur l'image
      const blob = await new Promise<Blob>((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error("Image vide"))), "image/webp", 0.92));
      const path = `${user.id}/avatar.webp`;
      const { error: upErr } = await supabase.storage.from("rider-avatars")
        .upload(path, blob, { upsert: true, contentType: "image/webp", cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("rider-avatars").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("profiles")
        .update({ avatar_url: `${data.publicUrl}?v=${Date.now()}`, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (dbErr) throw dbErr;
      await refreshProfile();
      toast.success("Ton badge est en place !");
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Enregistrement impossible");
    } finally {
      setEnregistre(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && etape !== "attente") reset(); if (etape !== "attente") onOpenChange(o); }}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-tight">Mon badge rider</DialogTitle>
          <DialogDescription className="text-sm">
            Une photo de toi, et l'IA te dessine un badge de rider. Tu choisis entre 2 propositions.
          </DialogDescription>
        </DialogHeader>

        {etape === "photo" && (
          <div className="space-y-4">
            {!src ? (
              <div className="grid grid-cols-2 gap-3">
                <label className={`${btn} bg-green-700 hover:bg-green-800 text-white cursor-pointer`}>
                  <Camera className="w-5 h-5" />Selfie
                  <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => prendre(e.target.files?.[0])} />
                </label>
                <label className={`${btn} border border-gray-300 text-carbon cursor-pointer`}>
                  <ImagePlus className="w-5 h-5" />Galerie
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => prendre(e.target.files?.[0])} />
                </label>
                <p className="col-span-2 text-sm text-gray-600">Ton visage de face, bien éclairé, sans lunettes de soleil : c'est ce qui donne le meilleur badge.</p>
              </div>
            ) : (
              <>
                <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden">
                  <Cropper image={src} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
                    onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCrop} />
                </div>
                <button type="button" onClick={() => setSrc(null)} className="text-sm text-gray-600 underline underline-offset-2 min-h-[44px]">Changer de photo</button>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-carbon">Ton style</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TENUES.map((t) => (
                      <button key={t.k} type="button" onClick={() => setTenue(t.k)}
                        className={`min-h-[44px] rounded-lg border px-2 text-sm font-semibold ${tenue === t.k ? "border-green-700 bg-green-700 text-white" : "border-gray-300 text-carbon"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-start gap-3 text-sm text-carbon">
                  <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} className="mt-0.5 w-5 h-5 accent-green-700 shrink-0" />
                  J'accepte que ma photo soit envoyée à un service d'IA (Google) pour créer mon badge. Elle n'est pas conservée : seul le badge que je choisis est gardé.
                </label>
                <button type="button" disabled={!accord || !zone} onClick={creer}
                  className={`${btn} w-full bg-green-700 hover:bg-green-800 text-white disabled:opacity-50`}>
                  <Sparkles className="w-5 h-5" />Créer mon badge
                </button>
                {restants !== null && <p className="text-sm text-gray-600 text-center">{restants} essai{restants > 1 ? "s" : ""} restant{restants > 1 ? "s" : ""}</p>}
              </>
            )}
          </div>
        )}

        {etape === "attente" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-green-700" />
            <p className="text-base font-semibold text-carbon">On dessine ton badge…</p>
            <p className="text-sm text-gray-600">Ça prend 10 à 30 secondes. Garde cette fenêtre ouverte.</p>
          </div>
        )}

        {etape === "choix" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {badges.map((b, i) => (
                <button key={i} type="button" onClick={() => setChoisi(i)} aria-pressed={choisi === i}
                  className={`relative rounded-2xl overflow-hidden border-4 ${choisi === i ? "border-green-700" : "border-transparent"}`}>
                  <img src={b} alt={`Proposition ${i + 1}`} className="w-full aspect-square object-cover" />
                  {choisi === i && <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>}
                </button>
              ))}
            </div>
            <button type="button" onClick={garder} disabled={enregistre}
              className={`${btn} w-full bg-green-700 hover:bg-green-800 text-white disabled:opacity-60`}>
              {enregistre ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}Prendre ce badge
            </button>
            {(restants === null || restants > 0) && (
              <button type="button" onClick={() => { setEtape("photo"); setBadges([]); }} className={`${btn} w-full border border-gray-300 text-carbon`}>
                <RotateCcw className="w-5 h-5" />Refaire{restants !== null ? ` (${restants} essai${restants > 1 ? "s" : ""} restant${restants > 1 ? "s" : ""})` : ""}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RiderBadgeIaDialog;
