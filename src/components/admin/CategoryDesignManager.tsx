import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ImagePlus, Check, FolderOpen, Settings2, Grid3X3 } from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

interface CategoryCard {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parts_count: number;
  image_url: string | null;
  subtitle: string | null;
  alt_text: string | null;
  seo_name: string | null;
  object_fit: string;
  object_position: string;
  col_span: number;
  row_span: number;
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
  const [configPanelId, setConfigPanelId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-category-design'],
    queryFn: async (): Promise<CategoryCard[]> => {
      const { data: cats, error: catsError } = await supabase
        .from('categories')
        .select(`id, name, slug, icon, parts:parts(count)`)
        .is('parent_id', null)
        .order('display_order');
      if (catsError) throw catsError;

      const { data: images, error: imgError } = await supabase
        .from('category_images')
        .select('category_id, image_url, subtitle, alt_text, seo_name, object_fit, object_position, col_span, row_span');
      if (imgError) throw imgError;

      const imageMap: Record<string, { url: string; subtitle: string | null; alt_text: string | null; seo_name: string | null; object_fit: string; object_position: string; col_span: number; row_span: number }> = {};
      images?.forEach((img: any) => {
        if (img.category_id) imageMap[img.category_id] = {
          url: img.image_url,
          subtitle: img.subtitle,
          alt_text: img.alt_text,
          seo_name: img.seo_name,
          object_fit: img.object_fit || 'cover',
          object_position: img.object_position || 'center',
          col_span: img.col_span || 1,
          row_span: img.row_span || 1,
        };
      });

      return (cats || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        parts_count: cat.parts?.[0]?.count || 0,
        image_url: imageMap[cat.id]?.url || null,
        subtitle: imageMap[cat.id]?.subtitle || null,
        alt_text: imageMap[cat.id]?.alt_text || null,
        seo_name: imageMap[cat.id]?.seo_name || null,
        object_fit: imageMap[cat.id]?.object_fit || 'cover',
        object_position: imageMap[cat.id]?.object_position || 'center',
        col_span: imageMap[cat.id]?.col_span || 1,
        row_span: imageMap[cat.id]?.row_span || 1,
      }));
    },
    staleTime: 0,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-category-design'] });
    queryClient.invalidateQueries({ queryKey: ['category-images'] });
  };

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
      // Cache-bust the URL
      const freshUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      
      // Optimistic update
      queryClient.setQueryData(['admin-category-design'], (old: CategoryCard[] | undefined) =>
        old?.map(c => c.id === categoryId ? { ...c, image_url: freshUrl } : c)
      );

      await upsertCategoryImage(categoryId, freshUrl);
      toast.success(`Image optimisée & renommée SEO`);
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
      invalidateAll(); // Rollback optimistic on error
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
    invalidateAll();
  };

  const handleLibrarySelect = async (url: string) => {
    if (!libraryForId) return;
    const freshUrl = `${url}?t=${Date.now()}`;
    // Optimistic
    queryClient.setQueryData(['admin-category-design'], (old: CategoryCard[] | undefined) =>
      old?.map(c => c.id === libraryForId ? { ...c, image_url: freshUrl } : c)
    );
    try {
      await upsertCategoryImage(libraryForId, freshUrl);
      toast.success('Image mise à jour depuis la bibliothèque');
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
      invalidateAll();
    }
    setLibraryForId(null);
  };

  const saveField = async (categoryId: string, field: string, value: string | number) => {
    try {
      const { error } = await supabase
        .from('category_images')
        .update({ [field]: value })
        .eq('category_id', categoryId);
      if (error) throw error;
      invalidateAll();
      toast.success('Enregistré');
      if (field === 'subtitle') setSubtitleEdits(prev => { const n = { ...prev }; delete n[categoryId]; return n; });
      if (field === 'alt_text') setAltEdits(prev => { const n = { ...prev }; delete n[categoryId]; return n; });
      if (field === 'seo_name') setSeoEdits(prev => { const n = { ...prev }; delete n[categoryId]; return n; });
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    }
  };

  const saveCardConfig = async (categoryId: string, field: string, value: string | number) => {
    // Optimistic update
    queryClient.setQueryData(['admin-category-design'], (old: CategoryCard[] | undefined) =>
      old?.map(c => c.id === categoryId ? { ...c, [field]: value } : c)
    );
    await saveField(categoryId, field, value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const configCat = categories?.find(c => c.id === configPanelId);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {categories?.map((cat) => {
          const isUploading = uploadingId === cat.id;
          const neon = neonColors[cat.slug] || '#93B5A1';
          const defaultLabel = racingLabels[cat.slug] || 'PREMIUM';
          const displaySubtitle = subtitleEdits[cat.id] ?? cat.subtitle ?? defaultLabel;

          return (
            <div
              key={cat.id}
              className="group relative rounded-xl border border-border/30 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* ── Live Bento Preview ── */}
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
                <div className="absolute inset-0 overflow-hidden">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={altEdits[cat.id] ?? cat.alt_text ?? cat.name}
                      className="w-full h-full"
                      style={{
                        objectFit: cat.object_fit as any,
                        objectPosition: cat.object_position,
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <ImagePlus className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, hsla(0,0%,0%,0.85) 0%, hsla(0,0%,0%,0.4) 50%, hsla(0,0%,0%,0.2) 100%)',
                  }}
                />

                <div className="absolute top-0 left-0 w-12 h-[1px] z-10 rounded-br" style={{ background: neon }} />
                <div className="absolute top-0 left-0 h-12 w-[1px] z-10 rounded-br" style={{ background: neon }} />

                <div className="absolute inset-x-0 bottom-0 p-4 z-10 flex flex-col justify-end">
                  <span
                    className="font-montserrat text-[10px] font-bold tracking-[0.2em] uppercase mb-1"
                    style={{ color: `${neon}BB` }}
                  >
                    {displaySubtitle}
                  </span>
                  <h4
                    className="font-display uppercase text-white text-lg"
                    style={{ fontWeight: 800, letterSpacing: '0.04em', textShadow: `0 0 20px ${neon}40` }}
                  >
                    {cat.name}
                  </h4>
                </div>

                {isUploading && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}

                <Badge className="absolute top-2 right-2 bg-background/80 text-foreground backdrop-blur-sm border-border/40 text-[10px] z-10">
                  {cat.parts_count} pièces
                </Badge>

                {/* Grid span badge */}
                {(cat.col_span > 1 || cat.row_span > 1) && (
                  <Badge className="absolute top-2 right-20 bg-primary/80 text-primary-foreground backdrop-blur-sm border-none text-[10px] z-10">
                    <Grid3X3 className="w-3 h-3 mr-1" />
                    {cat.col_span}×{cat.row_span}
                  </Badge>
                )}

                {cat.image_url && (
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center z-10" style={{ background: `${neon}CC` }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {cat.icon && <span className="text-base">{cat.icon}</span>}
                    <h3 className="font-semibold text-foreground text-sm truncate">{cat.name}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0"
                    onClick={() => setConfigPanelId(cat.id)}
                    title="Card Configuration"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <FieldRow
                  placeholder={defaultLabel}
                  value={subtitleEdits[cat.id] ?? cat.subtitle ?? ''}
                  onChange={(v) => setSubtitleEdits(prev => ({ ...prev, [cat.id]: v }))}
                  dirty={subtitleEdits[cat.id] !== undefined}
                  onSave={() => saveField(cat.id, 'subtitle', subtitleEdits[cat.id]!)}
                  label="Sous-titre"
                />

                <FieldRow
                  placeholder="nom-seo-fichier"
                  value={seoEdits[cat.id] ?? cat.seo_name ?? ''}
                  onChange={(v) => setSeoEdits(prev => ({ ...prev, [cat.id]: v }))}
                  dirty={seoEdits[cat.id] !== undefined}
                  onSave={() => saveField(cat.id, 'seo_name', seoEdits[cat.id]!)}
                  label="Nom SEO"
                />

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

      {/* ── Card Configuration Dialog ── */}
      <Dialog open={!!configPanelId} onOpenChange={() => setConfigPanelId(null)}>
        <DialogContent className="max-w-md" style={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 15%)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Settings2 className="w-5 h-5" />
              Card Configuration — {configCat?.name}
            </DialogTitle>
          </DialogHeader>
          {configCat && (
            <div className="space-y-4 pt-2">
              {/* Object Fit */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Object Fit</label>
                <Select
                  value={configCat.object_fit}
                  onValueChange={(v) => saveCardConfig(configCat.id, 'object_fit', v)}
                >
                  <SelectTrigger className="h-9 text-sm bg-background/50 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover (remplit)</SelectItem>
                    <SelectItem value="contain">Contain (entier)</SelectItem>
                    <SelectItem value="fill">Fill (étire)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Object Position */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Image Position</label>
                <Select
                  value={configCat.object_position}
                  onValueChange={(v) => saveCardConfig(configCat.id, 'object_position', v)}
                >
                  <SelectTrigger className="h-9 text-sm bg-background/50 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Column Span */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Column Span</label>
                <Select
                  value={String(configCat.col_span)}
                  onValueChange={(v) => saveCardConfig(configCat.id, 'col_span', parseInt(v))}
                >
                  <SelectTrigger className="h-9 text-sm bg-background/50 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 colonne</SelectItem>
                    <SelectItem value="2">2 colonnes (large)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row Span */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Row Span</label>
                <Select
                  value={String(configCat.row_span)}
                  onValueChange={(v) => saveCardConfig(configCat.id, 'row_span', parseInt(v))}
                >
                  <SelectTrigger className="h-9 text-sm bg-background/50 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 ligne</SelectItem>
                    <SelectItem value="2">2 lignes (tall)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview badge */}
              <div className="pt-2 border-t border-border/20">
                <p className="text-xs text-muted-foreground">
                  Disposition : <span className="font-mono text-foreground">{configCat.col_span}×{configCat.row_span}</span> · 
                  Fit : <span className="font-mono text-foreground">{configCat.object_fit}</span> · 
                  Pos : <span className="font-mono text-foreground">{configCat.object_position}</span>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
