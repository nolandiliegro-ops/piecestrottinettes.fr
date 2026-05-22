import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  brandSchema,
  slugify,
  COUNTRIES,
  type BrandFormValues,
} from "@/lib/brandValidation";
import BrandLogoUploader from "./BrandLogoUploader";

export interface BrandRow {
  id?: string;
  name: string;
  slug: string;
  logo_url: string | null;
  hero_image_url: string | null;
  tagline: string | null;
  description: string | null;
  editorial_verdict: string | null;
  country: string | null;
  founded_year: number | null;
  website_url: string | null;
  youtube_video_id: string | null;
  accent_color: string | null;
  display_order: number;
  published: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  brand?: BrandRow | null;
  suggestedOrder: number;
  onSaved: (b: BrandRow) => void;
}

const emptyValues: BrandFormValues = {
  name: "",
  slug: "",
  logo_url: undefined,
  hero_image_url: undefined,
  tagline: undefined,
  description: undefined,
  editorial_verdict: undefined,
  country: undefined,
  founded_year: undefined,
  website_url: undefined,
  youtube_video_id: undefined,
  accent_color: undefined,
  display_order: 0,
  published: false,
};

const toForm = (b: BrandRow | null | undefined, suggestedOrder: number): BrandFormValues => {
  if (!b) return { ...emptyValues, display_order: suggestedOrder };
  return {
    name: b.name,
    slug: b.slug,
    logo_url: b.logo_url ?? undefined,
    hero_image_url: b.hero_image_url ?? undefined,
    tagline: b.tagline ?? undefined,
    description: b.description ?? undefined,
    editorial_verdict: b.editorial_verdict ?? undefined,
    country: b.country ?? undefined,
    founded_year: b.founded_year ?? undefined,
    website_url: b.website_url ?? undefined,
    youtube_video_id: b.youtube_video_id ?? undefined,
    accent_color: b.accent_color ?? undefined,
    display_order: b.display_order ?? 0,
    published: !!b.published,
  };
};

const BrandFormDialog = ({ open, onOpenChange, brand, suggestedOrder, onSaved }: Props) => {
  const [values, setValues] = useState<BrandFormValues>(toForm(brand, suggestedOrder));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const originalSlug = brand?.slug;
  const isEdit = !!brand?.id;

  useEffect(() => {
    if (open) {
      setValues(toForm(brand, suggestedOrder));
      setErrors({});
      setSlugTouched(false);
    }
  }, [open, brand, suggestedOrder]);

  const set = <K extends keyof BrandFormValues>(k: K, v: BrandFormValues[K]) =>
    setValues((p) => ({ ...p, [k]: v }));

  const slugChanged = useMemo(
    () => isEdit && originalSlug && originalSlug !== values.slug,
    [isEdit, originalSlug, values.slug]
  );

  const handleNameChange = (name: string) => {
    setValues((p) => ({
      ...p,
      name,
      slug: !slugTouched && !isEdit ? slugify(name) : p.slug,
    }));
  };

  const handleSave = async () => {
    const parsed = brandSchema.safeParse(values);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path.join(".")] = i.message;
      });
      setErrors(errs);
      toast.error("Corrigez les erreurs du formulaire");
      return;
    }
    setErrors({});
    setSaving(true);
    const v = parsed.data;
    const payload = {
      name: v.name,
      slug: v.slug,
      logo_url: v.logo_url ?? null,
      hero_image_url: v.hero_image_url ?? null,
      tagline: v.tagline ?? null,
      description: v.description ?? null,
      editorial_verdict: v.editorial_verdict ?? null,
      country: v.country ?? null,
      founded_year: v.founded_year ?? null,
      website_url: v.website_url ?? null,
      youtube_video_id: v.youtube_video_id ?? null,
      accent_color: v.accent_color ?? null,
      display_order: v.display_order,
      published: v.published,
    };
    try {
      let saved: BrandRow;
      if (isEdit && brand?.id) {
        const { data, error } = await supabase
          .from("brands")
          .update(payload)
          .eq("id", brand.id)
          .select()
          .single();
        if (error) throw error;
        saved = data as BrandRow;
      } else {
        const { data, error } = await supabase
          .from("brands")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        saved = data as BrandRow;
      }
      onSaved(saved);
      toast.success(isEdit ? "Marque modifiée" : "Marque créée");
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      if (e?.code === "23505") {
        setErrors((p) => ({ ...p, slug: "Ce slug existe déjà" }));
        toast.error("Slug déjà utilisé");
      } else {
        toast.error(e?.message || "Erreur lors de la sauvegarde");
      }
    } finally {
      setSaving(false);
    }
  };

  const err = (k: string) =>
    errors[k] ? <p className="text-xs text-destructive mt-1">{errors[k]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Modifier "${brand?.name}"` : "Nouvelle marque"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-2 md:grid-cols-2">
          {/* Identité */}
          <div className="space-y-2 md:col-span-2">
            <Label>Nom *</Label>
            <Input
              value={values.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Dualtron"
            />
            {err("name")}
          </div>

          <div className="space-y-2">
            <Label>Slug *</Label>
            <Input
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              placeholder="dualtron"
            />
            {slugChanged && (
              <p className="text-[11px] text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Modifier ce slug cassera les liens SEO futurs
              </p>
            )}
            {err("slug")}
          </div>

          <div className="space-y-2">
            <Label>Ordre d'affichage</Label>
            <Input
              type="number"
              min={0}
              value={values.display_order}
              onChange={(e) => set("display_order", parseInt(e.target.value || "0", 10))}
            />
            {err("display_order")}
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <BrandLogoUploader
              value={values.logo_url}
              onChange={(u) => set("logo_url", u)}
              slug={values.slug || slugify(values.name)}
              variant="logo"
            />
          </div>

          <div className="space-y-2">
            <Label>Hero image</Label>
            <BrandLogoUploader
              value={values.hero_image_url}
              onChange={(u) => set("hero_image_url", u)}
              slug={values.slug || slugify(values.name)}
              variant="hero"
            />
          </div>

          {/* Editorial */}
          <div className="space-y-2 md:col-span-2">
            <Label>Tagline</Label>
            <Input
              value={values.tagline ?? ""}
              onChange={(e) => set("tagline", e.target.value || undefined)}
              placeholder="Performance extrême sans compromis"
              maxLength={160}
            />
            {err("tagline")}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={4}
              value={values.description ?? ""}
              onChange={(e) => set("description", e.target.value || undefined)}
            />
            {err("description")}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Note de l'expert</Label>
            <Textarea
              rows={3}
              value={values.editorial_verdict ?? ""}
              onChange={(e) => set("editorial_verdict", e.target.value || undefined)}
            />
            {err("editorial_verdict")}
          </div>

          {/* Meta */}
          <div className="space-y-2">
            <Label>Pays</Label>
            <Select
              value={values.country ?? ""}
              onValueChange={(v) => set("country", v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err("country")}
          </div>

          <div className="space-y-2">
            <Label>Année de fondation</Label>
            <Input
              type="number"
              min={1900}
              max={2026}
              value={values.founded_year ?? ""}
              onChange={(e) =>
                set(
                  "founded_year",
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
            />
            {err("founded_year")}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Site web</Label>
            <Input
              type="url"
              value={values.website_url ?? ""}
              onChange={(e) => set("website_url", e.target.value || undefined)}
              placeholder="https://..."
            />
            {err("website_url")}
          </div>

          <div className="space-y-2">
            <Label>URL ou ID YouTube</Label>
            <Input
              value={values.youtube_video_id ?? ""}
              onChange={(e) => set("youtube_video_id", e.target.value || undefined)}
              placeholder="https://youtu.be/dQw4w9WgXcQ ou dQw4w9WgXcQ"
            />
            <p className="text-[11px] text-muted-foreground">
              Colle une URL YouTube complète, on extrait l'ID automatiquement
            </p>
            {err("youtube_video_id")}
          </div>

          <div className="space-y-2">
            <Label>Couleur d'accent</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={values.accent_color ?? "#000000"}
                onChange={(e) => set("accent_color", e.target.value)}
                className="h-10 w-14 rounded border border-border bg-transparent cursor-pointer"
              />
              <Input
                value={values.accent_color ?? ""}
                onChange={(e) => set("accent_color", e.target.value || undefined)}
                placeholder="#DC2626"
                className="font-mono"
              />
            </div>
            {err("accent_color")}
          </div>

          <div className="flex items-center justify-between md:col-span-2 rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Publié</p>
              <p className="text-xs text-muted-foreground">
                Visible sur le site public si activé
              </p>
            </div>
            <Switch
              checked={values.published}
              onCheckedChange={(v) => set("published", v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BrandFormDialog;
