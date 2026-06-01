import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ImagePlus, Check, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

interface CategoryCard {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parts_count: number;
  image_url: string | null;
  // accent_label + neon_color : colonnes categories (Palier 0). alt_text/seo_name restent sur category_images.
  accent_label: string | null;
  neon_color: string | null;
  alt_text: string | null;
  seo_name: string | null;
}

const neonColors: Record<string, string> = {
  pneus: '#00BCD4',
  'disques-plaquettes': '#FF1744',
  'chambres-air': '#FFB300',
  chargeurs: '#00E676',
  batteries: '#7C4DFF',
  lumieres: '#FFD600',
  accessoires: '#FF9100',
};

const racingLabels: Record<string, string> = {
  pneus: 'PERFORMANCE',
  'disques-plaquettes': 'RACING',
  'chambres-air': 'ENDURANCE',
  chargeurs: 'HAUTE PRÉCISION',
  batteries: 'POWER',
  lumieres: 'VISIBILITÉ',
  accessoires: 'CUSTOM',
};

async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight: 1200,
    maxSizeMB: 0.5,
    fileType: 'image/webp',
    useWebWorker: true,
  });
}

function buildSeoFileName(slug: string, seoName: string | null, label: string): string {
  const name = seoName?.trim() || label.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '');
  return `${slug}-${name}.webp`;
}

// ── Library Modal ──
const LibraryModal = ({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (url: string) => void }) => {
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useState(() => {
    if (!open) return;
    setLoading(true);
    supabase.storage.from('category-images').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
      .then(({ data }) => {
        const promises = (data || []).filter(f => !f.metadata).map(folder =>
          supabase.storage.from('category-images').list(folder.name, { limit: 50 })
            .then(({ data: sub }) =>
              (sub || []).filter(sf => sf.metadata).map(sf => ({
                name: `${folder.name}/${sf.name}`,
                url: supabase.storage.from('category-images').getPublicUrl(`${folder.name}/${sf.name}`).data.publicUrl,
              }))
            )
        );
        Promise.all(promises).then(results => {
          setFiles(results.flat());
          setLoading(false);
        });
      });
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Bibliothèque d'images</DialogTitle></DialogHeader>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : files.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">Aucune image.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {files.map(f => (
              <button key={f.name} onClick={() => { onSelect(f.url); onClose(); }}
                className="group relative aspect-video rounded-lg overflow-hidden border border-border/30 hover:border-primary/60 transition-colors">
                <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Check className="w-6 h-6 text-primary" />
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const CategoryDesignManager = () => {
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [libraryForId, setLibraryForId] = useState<string | null>(null);
  const [subtitleEdits, setSubtitleEdits] = useState<Record<string, string>>({});
  const [altEdits, setAltEdits] = useState<Record<string, string>>({});
  const [seoEdits, setSeoEdits] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-category-design'],
    queryFn: async (): Promise<CategoryCard[]> => {
      const { data: cats, error: catsError } = await supabase
        .from('categories')
        .select(`id, name, slug, icon, accent_label, neon_color, parts:parts(count)`)
        .is('parent_id', null)
        .order('display_order');
      if (catsError) throw catsError;

      const { data: images, error: imgError } = await supabase
        .from('category_images')
        .select('category_id, image_url, alt_text, seo_name');
      if (imgError) throw imgError;

      const imageMap: Record<string, { url: string; alt_text: string | null; seo_name: string | null }> = {};
      images?.forEach((img: any) => {
        if (img.category_id) imageMap[img.category_id] = { url: img.image_url, alt_text: img.alt_text, seo_name: img.seo_name };
      });

      return (cats || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        parts_count: cat.parts?.[0]?.count || 0,
        image_url: imageMap[cat.id]?.url || null,
        accent_label: cat.accent_label || null,
        neon_color: cat.neon_color || null,
        alt_text: imageMap[cat.id]?.alt_text || null,
        seo_name: imageMap[cat.id]?.seo_name || null,
      }));
    },
  });

  const handleUpload = async (categoryId: string, file: File, cat: CategoryCard) => {
    setUploadingId(categoryId);
    try {
      const compressed = await compressImage(file);
      const seoFileName = buildSeoFileName(cat.slug, seoEdits[cat.id] ?? cat.seo_name, cat.name);
      const path = `${categoryId}/${seoFileName}`;
      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(path, compressed, { upsert: true, contentType: 'image/webp' });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('category-images').getPublicUrl(path);
      await upsertCategoryImage(categoryId, urlData.publicUrl);
      toast.success(`Image optimisée & renommée SEO`);
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const upsertCategoryImage = async (categoryId: string, imageUrl: string) => {
    const { data: existing } = await supabase.from('category_images').select('id').eq('category_id', categoryId).maybeSingle();
    if (existing) {
      const { error } = await supabase.from('category_images').update({ image_url: imageUrl }).eq('category_id', categoryId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('category_images').insert({ category_id: categoryId, image_url: imageUrl });
      if (error) throw error;
    }
    queryClient.invalidateQueries({ queryKey: ['admin-category-design'] });
    queryClient.invalidateQueries({ queryKey: ['category-images'] });
  };

  const handleLibrarySelect = async (url: string) => {
    if (!libraryForId) return;
    try {
      await upsertCategoryImage(libraryForId, url);
      toast.success('Image mise à jour depuis la bibliothèque');
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    }
    setLibraryForId(null);
  };

  const saveField = async (categoryId: string, field: 'subtitle' | 'alt_text' | 'seo_name', value: string) => {
    try {
      // Palier 0 : le sous-titre (label PERFORMANCE/RACING…) vit désormais sur
      // categories.accent_label. alt_text/seo_name restent sur category_images.
      const { error } =
        field === 'subtitle'
          ? await supabase.from('categories').update({ accent_label: value }).eq('id', categoryId)
          : await supabase.from('category_images').update({ [field]: value }).eq('category_id', categoryId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-category-design'] });
      queryClient.invalidateQueries({ queryKey: ['category-images'] });
      toast.success('Enregistré');
      if (field === 'subtitle') setSubtitleEdits(prev => { const n = { ...prev }; delete n[categoryId]; return n; });
      if (field === 'alt_text') setAltEdits(prev => { const n = { ...prev }; delete n[categoryId]; return n; });
      if (field === 'seo_name') setSeoEdits(prev => { const n = { ...prev }; delete n[categoryId]; return n; });
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {categories?.map((cat) => {
          const isUploading = uploadingId === cat.id;
          // Palier 0 : néon + label proviennent de categories (neon_color / accent_label),
          // fallback legacy par slug uniquement si la colonne BDD est encore NULL.
          const neon = cat.neon_color || neonColors[cat.slug] || '#93B5A1';
          const defaultLabel = racingLabels[cat.slug] || 'PREMIUM';
          const displaySubtitle = subtitleEdits[cat.id] ?? cat.accent_label ?? defaultLabel;

          return (
            <div
              key={cat.id}
              className="group relative rounded-xl border border-border/30 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* ── Live Bento Preview (1:1 mirror of CategoryBentoCard) ── */}
              <div
                className="relative aspect-[4/3] overflow-hidden rounded-t-xl"
                style={{
                  background: 'rgba(26,26,30,0.75)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: `0.5px solid ${neon}35`,
                  boxShadow: `0 0 15px ${neon}15, inset 0 1px 0 hsla(0,0%,100%,0.04)`,
                }}
              >
                {/* Image */}
                <div className="absolute inset-0 overflow-hidden">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={altEdits[cat.id] ?? cat.alt_text ?? cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <ImagePlus className="w-10 h-10" />
                    </div>
                  )}
                </div>

                {/* Dark gradient overlay — exact match */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, hsla(0,0%,0%,0.85) 0%, hsla(0,0%,0%,0.4) 50%, hsla(0,0%,0%,0.2) 100%)',
                  }}
                />

                {/* Neon accent lines — exact match */}
                <div className="absolute top-0 left-0 w-12 h-[1px] z-10 rounded-br" style={{ background: neon }} />
                <div className="absolute top-0 left-0 h-12 w-[1px] z-10 rounded-br" style={{ background: neon }} />

                {/* Content overlay — exact match */}
                <div className="absolute inset-x-0 bottom-0 p-4 z-10 flex flex-col justify-end">
                  <span
                    className="font-montserrat text-[10px] font-bold tracking-[0.2em] uppercase mb-1"
                    style={{ color: `${neon}BB` }}
                  >
                    {displaySubtitle}
                  </span>
                  <h4
                    className="font-display uppercase text-white text-lg"
                    style={{
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textShadow: `0 0 20px ${neon}40`,
                    }}
                  >
                    {cat.name}
                  </h4>
                </div>

                {/* Upload overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}

                <Badge className="absolute top-2 right-2 bg-background/80 text-foreground backdrop-blur-sm border-border/40 text-[10px] z-10">
                  {cat.parts_count} pièces
                </Badge>

                {cat.image_url && (
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center z-10" style={{ background: `${neon}CC` }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {cat.icon && <span className="text-base">{cat.icon}</span>}
                  <h3 className="font-semibold text-foreground text-sm truncate">{cat.name}</h3>
                </div>

                {/* Subtitle input */}
                <FieldRow
                  placeholder={defaultLabel}
                  value={subtitleEdits[cat.id] ?? cat.accent_label ?? ''}
                  onChange={(v) => setSubtitleEdits(prev => ({ ...prev, [cat.id]: v }))}
                  dirty={subtitleEdits[cat.id] !== undefined}
                  onSave={() => saveField(cat.id, 'subtitle', subtitleEdits[cat.id]!)}
                  label="Sous-titre"
                />

                {/* SEO Name input */}
                <FieldRow
                  placeholder="nom-seo-fichier"
                  value={seoEdits[cat.id] ?? cat.seo_name ?? ''}
                  onChange={(v) => setSeoEdits(prev => ({ ...prev, [cat.id]: v }))}
                  dirty={seoEdits[cat.id] !== undefined}
                  onSave={() => saveField(cat.id, 'seo_name', seoEdits[cat.id]!)}
                  label="Nom SEO"
                />

                {/* Alt text input */}
                <FieldRow
                  placeholder="Texte alternatif pour Google"
                  value={altEdits[cat.id] ?? cat.alt_text ?? ''}
                  onChange={(v) => setAltEdits(prev => ({ ...prev, [cat.id]: v }))}
                  dirty={altEdits[cat.id] !== undefined}
                  onSave={() => saveField(cat.id, 'alt_text', altEdits[cat.id]!)}
                  label="ALT"
                />

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => { fileInputRefs.current[cat.id] = el; }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(cat.id, f, cat); e.target.value = ''; }}
                />
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-7" disabled={isUploading}
                    onClick={() => fileInputRefs.current[cat.id]?.click()}>
                    <ImagePlus className="w-3 h-3 mr-1" />
                    {cat.image_url ? "Changer" : "Uploader"}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-7"
                    onClick={() => setLibraryForId(cat.id)}>
                    <FolderOpen className="w-3 h-3 mr-1" />
                    Biblio
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <LibraryModal open={!!libraryForId} onClose={() => setLibraryForId(null)} onSelect={handleLibrarySelect} />
    </>
  );
};

// ── Reusable field row ──
const FieldRow = ({ placeholder, value, onChange, dirty, onSave, label }: {
  placeholder: string; value: string; onChange: (v: string) => void; dirty: boolean; onSave: () => void; label: string;
}) => (
  <div className="flex gap-1.5 items-center">
    <span className="text-[10px] text-muted-foreground w-12 shrink-0 font-medium">{label}</span>
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs h-7 flex-1"
    />
    {dirty && (
      <Button size="sm" className="h-7 text-xs px-2" onClick={onSave}>OK</Button>
    )}
  </div>
);

export default CategoryDesignManager;
