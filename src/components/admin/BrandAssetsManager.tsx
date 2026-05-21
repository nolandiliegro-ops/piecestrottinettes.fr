import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, Image as ImageIcon, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { BRAND_ASSETS_FALLBACK, type BrandAssetKey } from "@/config/brand";
import { BRAND_ASSETS_QUERY_KEY } from "@/hooks/useBrandAssets";

interface BrandAssetRow {
  id: string;
  asset_key: string;
  asset_url: string;
  alt_text: string | null;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

const ASSET_LABELS: Record<BrandAssetKey, string> = {
  logo_main_light: "Logo principal (fond clair)",
  logo_main_dark: "Logo principal (fond sombre)",
  logo_compact_light: "Logo compact (fond clair)",
  logo_compact_dark: "Logo compact (fond sombre)",
  favicon: "Favicon",
  apple_touch_icon: "Apple Touch Icon",
  og_image: "Open Graph image",
  watermark_product: "Watermark produit",
};

const BrandAssetsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rows, isLoading, refetch } = useQuery({
    queryKey: ["admin-brand-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_assets")
        .select("*")
        .order("asset_key");
      if (error) throw error;
      return data as BrandAssetRow[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[hsl(0_0%_95%)]">Brand Assets</h2>
        <p className="text-sm text-[hsl(0_0%_55%)] mt-1">
          Logos, favicon, OG image et watermark. Modifiez ici sans toucher au code.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(rows ?? []).map((row) => (
          <BrandAssetCard
            key={row.id}
            row={row}
            onSaved={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: BRAND_ASSETS_QUERY_KEY });
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface CardProps {
  row: BrandAssetRow;
  onSaved: () => void;
}

const BrandAssetCard = ({ row, onSaved }: CardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [altText, setAltText] = useState(row.alt_text ?? "");
  const [savingAlt, setSavingAlt] = useState(false);

  const label = ASSET_LABELS[row.asset_key as BrandAssetKey] ?? row.asset_key;
  const fallback = BRAND_ASSETS_FALLBACK[row.asset_key as BrandAssetKey];
  const displayUrl = row.asset_url || fallback?.url || "";
  const isUsingFallback = !row.asset_url;

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fichier trop lourd", description: "Max 5 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${row.asset_key}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("brand-assets")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("brand-assets").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from("brand_assets")
        .update({ asset_url: publicUrl, updated_by: user?.id ?? null })
        .eq("id", row.id);
      if (updErr) throw updErr;

      toast({ title: "Asset mis à jour", description: label });
      onSaved();
    } catch (e: any) {
      toast({ title: "Erreur upload", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAltSave = async () => {
    setSavingAlt(true);
    try {
      const { error } = await supabase
        .from("brand_assets")
        .update({ alt_text: altText, updated_by: user?.id ?? null })
        .eq("id", row.id);
      if (error) throw error;
      toast({ title: "Texte alternatif enregistré" });
      onSaved();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setSavingAlt(false);
    }
  };

  return (
    <div className="rounded-xl border border-[hsl(0_0%_18%)] bg-[hsl(0_0%_12%)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[hsl(0_0%_95%)]">{label}</h3>
          {row.description && (
            <p className="text-xs text-[hsl(0_0%_55%)] mt-0.5">{row.description}</p>
          )}
        </div>
        {isUsingFallback ? (
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-amber-500/15 text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Fallback
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
            <Check className="w-3 h-3" /> En ligne
          </span>
        )}
      </div>

      <div
        className="h-32 rounded-lg flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
          backgroundColor: "#1a1a1a",
        }}
      >
        {displayUrl ? (
          <img src={displayUrl} alt={altText || label} className="max-h-full max-w-full object-contain" />
        ) : (
          <ImageIcon className="w-8 h-8 text-[hsl(0_0%_30%)]" />
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-[hsl(0_0%_55%)]">Texte alternatif (accessibilité)</Label>
        <div className="flex gap-2">
          <Input
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Description de l'image…"
            className="bg-[hsl(0_0%_15%)] border-[hsl(0_0%_22%)] text-sm"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAltSave}
            disabled={savingAlt || altText === (row.alt_text ?? "")}
          >
            {savingAlt ? <Loader2 className="w-4 h-4 animate-spin" /> : "OK"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-[10px] text-[hsl(0_0%_45%)]">
          Maj : {new Date(row.updated_at).toLocaleString("fr-FR")}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
          className="hidden"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-primary hover:bg-primary/90"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Upload…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" /> Remplacer
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BrandAssetsManager;
