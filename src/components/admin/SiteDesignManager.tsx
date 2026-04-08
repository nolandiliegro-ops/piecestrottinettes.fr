import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, ShoppingBag, Package, Gauge, Loader2, ImagePlus, Check, FolderOpen, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { useSiteAssets, useUpsertSiteAsset, type SiteAsset } from '@/hooks/useSiteAssets';
import CategoryDesignManager from './CategoryDesignManager';

const SECTION_CONFIG: Record<string, { icon: React.ReactNode; title: string; description: string }> = {
  catalogue: { icon: <ShoppingBag className="w-5 h-5" />, title: 'Catalogue', description: 'Gérez les visuels du catalogue' },
  produits: { icon: <Package className="w-5 h-5" />, title: 'Produits', description: 'Image par défaut pour les produits sans photo' },
  garage: { icon: <Gauge className="w-5 h-5" />, title: 'Garage', description: 'Visuels du cockpit utilisateur' },
};

async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight: 1200,
    maxSizeMB: 0.5,
    fileType: 'image/webp',
    useWebWorker: true,
  });
}

function buildSeoFileName(assetKey: string, seoName: string | null, label: string): string {
  const name = seoName?.trim() || label.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/-+$/, '');
  return `${assetKey}-${name}.webp`;
}

// ── Library Modal ──
const LibraryModal = ({ open, onClose, onSelect, bucket }: { open: boolean; onClose: () => void; onSelect: (url: string) => void; bucket: string }) => {
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase.storage.from(bucket).list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
      .then(({ data }) => {
        const promises = (data || []).filter(f => f.id === null || !f.metadata).map(folder =>
          supabase.storage.from(bucket).list(folder.name, { limit: 50, sortBy: { column: 'created_at', order: 'desc' } })
            .then(({ data: subFiles }) =>
              (subFiles || []).filter(sf => sf.metadata).map(sf => ({
                name: `${folder.name}/${sf.name}`,
                url: supabase.storage.from(bucket).getPublicUrl(`${folder.name}/${sf.name}`).data.publicUrl,
              }))
            )
        );
        const directFiles = (data || []).filter(f => f.metadata).map(f => ({
          name: f.name,
          url: supabase.storage.from(bucket).getPublicUrl(f.name).data.publicUrl,
        }));
        Promise.all(promises).then(results => {
          setFiles([...directFiles, ...results.flat()]);
          setLoading(false);
        });
      });
  }, [open, bucket]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bibliothèque — {bucket}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : files.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">Aucune image dans ce bucket.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {files.map((f) => (
              <button
                key={f.name}
                onClick={() => { onSelect(f.url); onClose(); }}
                className="group relative aspect-video rounded-lg overflow-hidden border border-border/30 hover:border-primary/60 transition-colors"
              >
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

// ── Asset Card ──
const AssetCard = ({ asset, bucket = 'site-assets' }: { asset: SiteAsset; bucket?: string }) => {
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [subtitleValue, setSubtitleValue] = useState(asset.subtitle || '');
  const [subtitleDirty, setSubtitleDirty] = useState(false);
  const [altValue, setAltValue] = useState(asset.alt_text || '');
  const [altDirty, setAltDirty] = useState(false);
  const [seoValue, setSeoValue] = useState(asset.seo_name || '');
  const [seoDirty, setSeoDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { upsertAsset, updateSubtitle, updateSeoFields } = useUpsertSiteAsset();

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const seoFileName = buildSeoFileName(asset.asset_key, seoValue || asset.seo_name, asset.label);
      const path = `${asset.asset_key}/${seoFileName}`;
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, compressed, { upsert: true, contentType: 'image/webp' });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      await upsertAsset(asset.asset_key, urlData.publicUrl);
      toast.success(`"${asset.label}" optimisé & renommé SEO`);
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLibrarySelect = async (url: string) => {
    try {
      await upsertAsset(asset.asset_key, url);
      toast.success(`"${asset.label}" mis à jour depuis la bibliothèque`);
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    }
  };

  const saveSubtitle = async () => {
    try {
      await updateSubtitle(asset.asset_key, subtitleValue);
      setSubtitleDirty(false);
      toast.success('Sous-titre enregistré');
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    }
  };

  const saveAlt = async () => {
    try {
      await updateSeoFields(asset.asset_key, { alt_text: altValue });
      setAltDirty(false);
      toast.success('Texte ALT enregistré');
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    }
  };

  const saveSeo = async () => {
    try {
      await updateSeoFields(asset.asset_key, { seo_name: seoValue });
      setSeoDirty(false);
      toast.success('Nom SEO enregistré');
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    }
  };

  return (
    <>
      <div className="group relative rounded-xl border border-border/30 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        {/* Live Preview */}
        <div className="relative aspect-video" style={{ background: 'rgba(26,26,30,0.95)' }}>
          {asset.asset_url ? (
            <img src={asset.asset_url} alt={altValue || asset.label} className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
              <ImagePlus className="w-10 h-10" />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.15) 100%)' }} />

          <div className="absolute inset-x-0 bottom-0 p-4 z-10">
            {subtitleValue && (
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/80 block mb-0.5">
                {subtitleValue}
              </span>
            )}
            <h4 className="text-white font-extrabold uppercase text-sm tracking-wider" style={{ textShadow: '0 0 15px rgba(147,181,161,0.4)' }}>
              {asset.label}
            </h4>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {asset.asset_url && (
            <div className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full bg-primary/90 flex items-center justify-center z-10">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-2">
          <div>
            <h3 className="font-semibold text-foreground text-sm">{asset.label}</h3>
            <Badge variant="outline" className="mt-1 text-xs">{asset.asset_key}</Badge>
          </div>

          <FieldRow
            label="Sous-titre"
            placeholder="Ex: PERFORMANCE"
            value={subtitleValue}
            onChange={(v) => { setSubtitleValue(v); setSubtitleDirty(true); }}
            dirty={subtitleDirty}
            onSave={saveSubtitle}
          />
          <FieldRow
            label="Nom SEO"
            placeholder="nom-seo-fichier"
            value={seoValue}
            onChange={(v) => { setSeoValue(v); setSeoDirty(true); }}
            dirty={seoDirty}
            onSave={saveSeo}
          />
          <FieldRow
            label="ALT"
            placeholder="Texte alternatif pour Google"
            value={altValue}
            onChange={(v) => { setAltValue(v); setAltDirty(true); }}
            dirty={altDirty}
            onSave={saveAlt}
          />

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = '';
            }}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
              {asset.asset_url ? "Changer" : "Uploader"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setLibraryOpen(true)}
            >
              <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
              Bibliothèque
            </Button>
          </div>
        </div>
      </div>
      <LibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={handleLibrarySelect}
        bucket={bucket}
      />
    </>
  );
};

// ── Section Grid ──
const SectionGrid = ({ section }: { section: string }) => {
  const { data: assets, isLoading } = useSiteAssets(section);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const config = SECTION_CONFIG[section];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {config.icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {assets?.map((a) => <AssetCard key={a.id} asset={a} />)}
      </div>
    </div>
  );
};

// ── Shipping Config ──
const ShippingConfig = () => {
  const [threshold, setThreshold] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('site_assets')
      .select('asset_url')
      .eq('asset_key', 'shipping_free_threshold')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.asset_url) setThreshold(data.asset_url);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('site_assets')
      .update({ asset_url: threshold })
      .eq('asset_key', 'shipping_free_threshold');
    if (error) toast.error(error.message);
    else toast.success('Seuil mis à jour');
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="bg-card rounded-xl border border-border/30 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">Seuil de livraison gratuite</h4>
          <p className="text-xs text-muted-foreground">Livraison gratuite dès ce montant HT (€). Laisser vide ou 0 pour désactiver.</p>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <Input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="49"
          className="w-32 text-sm"
          min={0}
          step={1}
        />
        <span className="text-sm text-muted-foreground">€</span>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

// ── Main Hub ──
const SiteDesignManager = () => {
  return (
    <div className="space-y-6">
      <ShippingConfig />
      <Tabs defaultValue="accueil" className="space-y-6">
        <TabsList className="bg-background/10 border border-border/20 p-1">
          <TabsTrigger value="accueil" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 gap-2 px-4 py-2">
            <Home className="w-4 h-4" /> Accueil
          </TabsTrigger>
          <TabsTrigger value="catalogue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 gap-2 px-4 py-2">
            <ShoppingBag className="w-4 h-4" /> Catalogue
          </TabsTrigger>
          <TabsTrigger value="produits" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 gap-2 px-4 py-2">
            <Package className="w-4 h-4" /> Produits
          </TabsTrigger>
          <TabsTrigger value="garage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 gap-2 px-4 py-2">
            <Gauge className="w-4 h-4" /> Garage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accueil">
          <CategoryDesignManager />
        </TabsContent>
        <TabsContent value="catalogue">
          <SectionGrid section="catalogue" />
        </TabsContent>
        <TabsContent value="produits">
          <SectionGrid section="produits" />
        </TabsContent>
        <TabsContent value="garage">
          <SectionGrid section="garage" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteDesignManager;
