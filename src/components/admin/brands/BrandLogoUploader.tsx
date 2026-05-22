import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string | undefined;
  onChange: (url: string | undefined) => void;
  slug: string;
  variant: "logo" | "hero";
  maxMB?: number;
}

const BrandLogoUploader = ({ value, onChange, slug, variant, maxMB }: Props) => {
  const [uploading, setUploading] = useState(false);
  const limit = maxMB ?? (variant === "logo" ? 2 : 5);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (file.size > limit * 1024 * 1024) {
      toast.error(`Image trop lourde (max ${limit}MB)`);
      return;
    }
    if (!slug) {
      toast.error("Renseignez d'abord le nom (slug) avant d'uploader");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const prefix = variant === "logo" ? "brand" : "brand-hero";
      const fileName = `${prefix}-${slug}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("category-images")
        .upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("category-images").getPublicUrl(fileName);
      onChange(data.publicUrl);
      toast.success(variant === "logo" ? "Logo uploadé" : "Hero image uploadée");
    } catch (e) {
      console.error(e);
      toast.error("Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const aspect = variant === "logo" ? "aspect-square w-24" : "aspect-video w-full max-w-xs";

  return (
    <div className="space-y-2">
      <div
        className={`${aspect} relative rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center group`}
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-contain p-1" />
        ) : (
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Input
            type="file"
            accept="image/png,image/webp,image/svg+xml,image/jpeg"
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <Upload className="w-5 h-5 text-white" />
          )}
        </div>
      </div>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(undefined)}
          className="h-7 text-xs gap-1"
        >
          <X className="w-3 h-3" /> Retirer
        </Button>
      )}
      <p className="text-[10px] text-muted-foreground">
        PNG / WEBP / SVG / JPG · max {limit}MB
      </p>
    </div>
  );
};

export default BrandLogoUploader;
