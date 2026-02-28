import { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, ShoppingBag, Package, Gauge, Loader2, ImagePlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSiteAssets, useUpsertSiteAsset, type SiteAsset } from '@/hooks/useSiteAssets';
import CategoryDesignManager from './CategoryDesignManager';

const SECTION_CONFIG: Record<string, { icon: React.ReactNode; title: string; description: string }> = {
  catalogue: { icon: <ShoppingBag className="w-5 h-5" />, title: 'Catalogue', description: 'Gérez les visuels du catalogue' },
  produits: { icon: <Package className="w-5 h-5" />, title: 'Produits', description: 'Image par défaut pour les produits sans photo' },
  garage: { icon: <Gauge className="w-5 h-5" />, title: 'Garage', description: 'Visuels du cockpit utilisateur' },
};

const AssetCard = ({ asset }: { asset: SiteAsset }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { upsertAsset } = useUpsertSiteAsset();

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `${asset.asset_key}/${Date.now()}.webp`;
      const { error: uploadErr } = await supabase.storage
        .from('site-assets')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
      await upsertAsset(asset.asset_key, urlData.publicUrl);
      toast.success(`"${asset.label}" mis à jour`);
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="group relative rounded-xl border border-border/30 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="relative aspect-video bg-muted">
        {asset.asset_url ? (
          <img src={asset.asset_url} alt={asset.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <ImagePlus className="w-10 h-10" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        {asset.asset_url && (
          <div className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full bg-primary/90 flex items-center justify-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground text-sm">{asset.label}</h3>
          <Badge variant="outline" className="mt-1 text-xs">{asset.asset_key}</Badge>
        </div>
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
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
          {asset.asset_url ? "Changer l'image" : "Ajouter une image"}
        </Button>
      </div>
    </div>
  );
};

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

const SiteDesignManager = () => {
  return (
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
  );
};

export default SiteDesignManager;
