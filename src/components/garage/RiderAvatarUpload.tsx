import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import imageCompression from "browser-image-compression";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RiderAvatarUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: (url: string) => void;
}

// Crop helper -> WebP blob
async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/webp", 0.92),
  );
}

const RiderAvatarUpload = ({ open, onOpenChange, onUploaded }: RiderAvatarUploadProps) => {
  const { user } = useAuth();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
  };

  const handleFile = (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast.error("Format non supporté (JPG, PNG ou WEBP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image trop lourde (max 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!user) return toast.error("Non authentifié");
    if (!imageSrc || !croppedArea) return toast.error("Sélectionnez une image");
    setUploading(true);
    try {
      const rawBlob = await getCroppedBlob(imageSrc, croppedArea);
      const compressedFile = await imageCompression(
        new File([rawBlob], "avatar.webp", { type: "image/webp" }),
        { maxSizeMB: 0.5, maxWidthOrHeight: 512, useWebWorker: true, fileType: "image/webp" },
      ).catch(() => new File([rawBlob], "avatar.webp", { type: "image/webp" }));

      const path = `${user.id}/avatar.webp`;
      const { error: upErr } = await supabase.storage
        .from("rider-avatars")
        .upload(path, compressedFile, { upsert: true, contentType: "image/webp", cacheControl: "3600" });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("rider-avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (dbErr) throw dbErr;

      toast.success("Photo de profil mise à jour");
      onUploaded(url);
      reset();
      onOpenChange(false);
    } catch (e: any) {
      console.error("[RiderAvatarUpload] error", e);
      toast.error(e?.message ?? "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Photo de profil</DialogTitle>
          <DialogDescription>
            Choisissez une image, ajustez le cadrage circulaire, puis enregistrez.
          </DialogDescription>
        </DialogHeader>

        {!imageSrc ? (
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-mineral/30 rounded-2xl p-10 cursor-pointer hover:bg-mineral/5 transition">
            <Upload className="w-8 h-8 text-mineral/60" />
            <span className="text-sm text-carbon/70">Cliquez pour choisir une image</span>
            <span className="text-[11px] text-carbon/40">JPG, PNG ou WEBP — max 10MB</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full h-64 bg-carbon/5 rounded-xl overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-carbon/60">Zoom</label>
              <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={(v) => setZoom(v[0])} />
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-carbon/50 hover:text-carbon underline underline-offset-2"
            >
              Choisir une autre image
            </button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!imageSrc || uploading}>
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RiderAvatarUpload;
