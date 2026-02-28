import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryCard {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parts_count: number;
  image_url: string | null;
}

const CategoryDesignManager = () => {
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-category-design'],
    queryFn: async (): Promise<CategoryCard[]> => {
      // Fetch parent categories with part counts
      const { data: cats, error: catsError } = await supabase
        .from('categories')
        .select(`id, name, slug, icon, parts:parts(count)`)
        .is('parent_id', null)
        .order('display_order');

      if (catsError) throw catsError;

      // Fetch category images
      const { data: images, error: imgError } = await supabase
        .from('category_images')
        .select('category_id, image_url');

      if (imgError) throw imgError;

      const imageMap: Record<string, string> = {};
      images?.forEach((img) => {
        if (img.category_id) imageMap[img.category_id] = img.image_url;
      });

      return (cats || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        parts_count: cat.parts?.[0]?.count || 0,
        image_url: imageMap[cat.id] || null,
      }));
    },
  });

  const handleUpload = async (categoryId: string, file: File) => {
    setUploadingId(categoryId);
    try {
      const timestamp = Date.now();
      const path = `${categoryId}/${timestamp}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('category-images')
        .getPublicUrl(path);

      // Delete old entry then insert new one
      await supabase
        .from('category_images')
        .delete()
        .eq('category_id', categoryId);

      const { error: insertError } = await supabase
        .from('category_images')
        .insert({ category_id: categoryId, image_url: urlData.publicUrl });

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ['admin-category-design'] });
      queryClient.invalidateQueries({ queryKey: ['category-images'] });
      toast.success(`Image mise à jour pour "${categories?.find(c => c.id === categoryId)?.name}"`);
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error("Erreur lors de l'upload : " + err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const onFileChange = (categoryId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(categoryId, file);
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {categories?.map((cat) => {
        const isUploading = uploadingId === cat.id;
        return (
          <div
            key={cat.id}
            className="group relative rounded-xl border border-border/30 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            {/* Image Preview */}
            <div className="relative aspect-video bg-muted">
              {cat.image_url ? (
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                  <ImagePlus className="w-10 h-10" />
                </div>
              )}

              {/* Upload overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              {/* Parts count badge */}
              <Badge className="absolute top-2.5 right-2.5 bg-background/80 text-foreground backdrop-blur-sm border-border/40 text-xs">
                {cat.parts_count} pièces
              </Badge>

              {/* Status indicator */}
              {cat.image_url && (
                <div className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full bg-primary/90 flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                {cat.icon && <span className="text-lg">{cat.icon}</span>}
                <h3 className="font-semibold text-foreground text-sm truncate">{cat.name}</h3>
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={(el) => { fileInputRefs.current[cat.id] = el; }}
                onChange={onFileChange(cat.id)}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                disabled={isUploading}
                onClick={() => fileInputRefs.current[cat.id]?.click()}
              >
                <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
                {cat.image_url ? "Changer l'image" : "Ajouter une image"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryDesignManager;
