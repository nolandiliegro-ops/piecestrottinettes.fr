import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import { HomeBridgeView } from "@/components/home/HomeBridge";
import {
  useHomeBridge,
  useUpdateHomeBridge,
  type HomeBridgeColorMode,
  type HomeBridgeSettings,
} from "@/hooks/useHomeBridge";

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

const HomeBridgeManager = () => {
  const { data: published, isLoading } = useHomeBridge();
  const updateMutation = useUpdateHomeBridge();

  const [local, setLocal] = useState<HomeBridgeSettings | null>(null);

  // Sync local state when published changes (initial load + post-mutation refresh)
  useEffect(() => {
    if (published) setLocal(published);
  }, [published]);

  if (isLoading || !local || !published) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasChanges = JSON.stringify(local) !== JSON.stringify(published);
  const hexValid = HEX_PATTERN.test(local.dark_block_color);
  const textValid = local.watermark_text.trim().length > 0;
  const canPublish = hasChanges && hexValid && textValid;

  const handleReset = () => setLocal(published);

  const handlePublish = async () => {
    try {
      await updateMutation.mutateAsync({
        id: local.id,
        patch: {
          is_enabled: local.is_enabled,
          watermark_text: local.watermark_text.trim(),
          watermark_opacity: local.watermark_opacity,
          watermark_color_mode: local.watermark_color_mode,
          dark_block_color: local.dark_block_color,
        },
      });
      toast.success("Modifications publiées");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Une erreur est survenue";
      toast.error("Erreur lors de la publication", { description: message });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[hsl(0_0%_95%)]">Home Bridge</h2>
          <p className="text-sm text-[hsl(0_0%_55%)] mt-0.5">
            Bloc dark entre la hero et le carrousel — filigrane éditable, couleur ajustable.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6">
        {/* Panel gauche — édition */}
        <div className="rounded-xl border border-[hsl(0_0%_18%)] bg-[hsl(0_0%_12%)] p-5 space-y-5">
          {/* 1. Switch is_enabled */}
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="hb-enabled" className="text-sm text-[hsl(0_0%_95%)] cursor-pointer">
              Activer le bloc dark
            </Label>
            <Switch
              id="hb-enabled"
              checked={local.is_enabled}
              onCheckedChange={(v) => setLocal({ ...local, is_enabled: v })}
            />
          </div>

          {/* 2. Input watermark_text */}
          <div className="space-y-2">
            <Label htmlFor="hb-text" className="text-sm text-[hsl(0_0%_95%)]">
              Texte du filigrane
            </Label>
            <Input
              id="hb-text"
              value={local.watermark_text}
              maxLength={40}
              placeholder="PIECESTROTTINETTES"
              onChange={(e) => setLocal({ ...local, watermark_text: e.target.value })}
              className="bg-[hsl(0_0%_15%)] border-[hsl(0_0%_22%)] text-[hsl(0_0%_95%)]"
            />
            <p className="text-[10px] text-[hsl(0_0%_45%)] tabular-nums">
              {local.watermark_text.length} / 40 caractères
            </p>
          </div>

          {/* 3. Slider watermark_opacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="hb-opacity" className="text-sm text-[hsl(0_0%_95%)]">
                Opacité du filigrane
              </Label>
              <span className="text-xs text-[hsl(0_0%_55%)] tabular-nums">
                {local.watermark_opacity.toFixed(1)} / 15
              </span>
            </div>
            <Slider
              id="hb-opacity"
              min={0}
              max={15}
              step={0.5}
              value={[local.watermark_opacity]}
              onValueChange={([v]) => setLocal({ ...local, watermark_opacity: v })}
            />
          </div>

          {/* 4. RadioGroup watermark_color_mode */}
          <div className="space-y-2">
            <Label className="text-sm text-[hsl(0_0%_95%)]">
              Mode couleur du filigrane
            </Label>
            <RadioGroup
              value={local.watermark_color_mode}
              onValueChange={(v) =>
                setLocal({ ...local, watermark_color_mode: v as HomeBridgeColorMode })
              }
              className="grid grid-cols-1 gap-1.5"
            >
              <RadioRow value="auto" label="Auto" />
              <RadioRow value="light" label="Clair (texte blanc)" />
              <RadioRow value="dark" label="Foncé (texte noir)" />
            </RadioGroup>
          </div>

          {/* 5. Color picker dark_block_color */}
          <div className="space-y-2">
            <Label htmlFor="hb-color" className="text-sm text-[hsl(0_0%_95%)]">
              Couleur du bloc dark
            </Label>
            <div className="flex gap-2">
              <input
                id="hb-color"
                type="color"
                value={hexValid ? local.dark_block_color : "#3A3A3A"}
                onChange={(e) => setLocal({ ...local, dark_block_color: e.target.value })}
                className="h-10 w-14 rounded border border-[hsl(0_0%_22%)] cursor-pointer bg-transparent"
                aria-label="Sélecteur de couleur"
              />
              <Input
                value={local.dark_block_color}
                onChange={(e) => setLocal({ ...local, dark_block_color: e.target.value })}
                placeholder="#3A3A3A"
                maxLength={7}
                className="flex-1 bg-[hsl(0_0%_15%)] border-[hsl(0_0%_22%)] text-[hsl(0_0%_95%)] font-mono text-sm"
                aria-label="Hex manuel"
              />
            </div>
            {!hexValid && (
              <p className="text-[10px] text-red-400">
                Format invalide. Utilise #RRGGBB (ex: #3A3A3A).
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-[hsl(0_0%_18%)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges || updateMutation.isPending}
            >
              Réinitialiser
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={!canPublish || updateMutation.isPending}
              className="ml-auto bg-primary hover:bg-primary/90"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Publication…
                </>
              ) : (
                "Publier"
              )}
            </Button>
          </div>
        </div>

        {/* Panel droite — preview live */}
        <div className="rounded-xl border border-[hsl(0_0%_18%)] bg-[hsl(0_0%_12%)] p-5 space-y-3">
          <div>
            <Label className="text-sm text-[hsl(0_0%_95%)]">Preview live</Label>
            <p className="text-xs text-[hsl(0_0%_55%)] mt-0.5">
              Reflète l'état en cours d'édition, pas la valeur publiée.
            </p>
          </div>
          <div className="rounded-lg overflow-hidden border border-[hsl(0_0%_22%)]">
            <HomeBridgeView settings={local} />
          </div>
          {!local.is_enabled && (
            <p className="text-xs text-amber-400">
              Le bloc est désactivé — il ne s'affichera pas sur le site.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const RadioRow = ({ value, label }: { value: string; label: string }) => (
  <label
    htmlFor={`hb-mode-${value}`}
    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(0_0%_22%)] cursor-pointer hover:bg-[hsl(0_0%_15%)] transition-colors"
  >
    <RadioGroupItem value={value} id={`hb-mode-${value}`} />
    <span className="text-sm text-[hsl(0_0%_85%)]">{label}</span>
  </label>
);

export default HomeBridgeManager;
