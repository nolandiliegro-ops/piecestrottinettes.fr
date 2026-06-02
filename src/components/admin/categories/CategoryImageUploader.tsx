import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { useUploadCategoryImage, type AdminCategory } from "@/hooks/useAdminCategories";

interface CategoryImageUploaderProps {
  category: AdminCategory | null;
}

// Section "Visuel" : upload image catégorie -> bucket category-images
// (path {categoryId}/{seo}.webp, webp, upsert) puis écrit categories.image_url.
const CategoryImageUploader = ({ category }: CategoryImageUploaderProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMut = useUploadCategoryImage();

  if (!category) {
    return (
      <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border/60 p-3">
        Enregistre d'abord la catégorie pour pouvoir lui ajouter une image.
      </p>
    );
  }

  const handleFile = async (file: File) => {
    try {
      await uploadMut.mutateAsync({ category, file });
      toast.success("Image optimisée & renommée SEO");
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    }
  };

  const uploading = uploadMut.isPending;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border/40 bg-[#1A1A1E]">
        {category.image_url ? (
          <img src={category.image_url} alt={category.alt_text || category.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <ImagePlus className="h-10 w-10" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileRef}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full min-h-[44px]"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        <ImagePlus className="mr-1.5 h-4 w-4" />
        {category.image_url ? "Changer l'image" : "Uploader une image"}
      </Button>
    </div>
  );
};

export default CategoryImageUploader;
