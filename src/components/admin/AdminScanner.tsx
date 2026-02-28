import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, ArrowRight, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

type WizardStep = 'photo' | 'details' | 'specs';

const slugify = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const AdminScanner = () => {
  const [step, setStep] = useState<WizardStep>('photo');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [voltage, setVoltage] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sku, setSku] = useState('');

  const { data: brands } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      const { data } = await supabase.from('brands').select('id, name').order('name');
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      return data || [];
    },
  });

  const handleImageCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    // Auto-advance to details
    setTimeout(() => setStep('details'), 300);
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !categoryId) {
      toast.error('Nom et catégorie requis');
      return;
    }

    setSaving(true);
    try {
      let imageUrl: string | null = null;

      // Upload image if present
      if (imageFile) {
        setUploading(true);
        const slug = slugify(name);
        const ext = imageFile.name.split('.').pop();
        const fileName = `${slug}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('part-images').upload(fileName, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('part-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
        setUploading(false);
      }

      const slug = slugify(name);
      const { error } = await supabase.from('parts').insert({
        name: name.trim(),
        slug,
        category_id: categoryId,
        price: price ? parseFloat(price) : null,
        stock_quantity: stock ? parseInt(stock) : 0,
        description: description.trim() || null,
        difficulty_level: difficulty ? parseInt(difficulty) : null,
        image_url: imageUrl,
        sku: sku.trim() || null,
      });

      if (error) throw error;

      toast.success('Pièce ajoutée avec succès !');
      // Reset
      resetForm();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const resetForm = () => {
    setStep('photo');
    setImageFile(null);
    setImagePreview(null);
    setName('');
    setBrandId('');
    setCategoryId('');
    setPrice('');
    setStock('');
    setDescription('');
    setVoltage('');
    setDifficulty('');
    setSku('');
  };

  const steps: { id: WizardStep; label: string; num: number }[] = [
    { id: 'photo', label: 'Photo', num: 1 },
    { id: 'details', label: 'Détails', num: 2 },
    { id: 'specs', label: 'Specs', num: 3 },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 px-4 pt-4 pb-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.id)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step === s.id
                  ? "bg-primary text-primary-foreground"
                  : steps.findIndex(x => x.id === step) > i
                    ? "bg-primary/30 text-primary"
                    : "bg-[hsl(0_0%_100%/0.1)] text-[hsl(0_0%_55%)]"
              )}
            >
              {s.num}
            </button>
            <span className={cn(
              "text-xs font-medium hidden sm:block",
              step === s.id ? "text-primary" : "text-[hsl(0_0%_55%)]"
            )}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={cn(
                "w-8 h-px",
                steps.findIndex(x => x.id === step) > i ? "bg-primary" : "bg-[hsl(0_0%_18%)]"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          {/* STEP 1: Photo */}
          {step === 'photo' && (
            <motion.div
              key="photo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center justify-center h-full gap-4"
            >
              {imagePreview ? (
                <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden admin-glass-card">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-4" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-destructive/80 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-sm aspect-square rounded-2xl admin-glass-card flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-[hsl(0_0%_55%)]">Prenez ou importez une photo</p>
                </div>
              )}

              <div className="flex gap-3 w-full max-w-sm">
                <Button
                  variant="outline"
                  className="flex-1 min-h-[48px] bg-[hsl(0_0%_100%/0.05)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)] hover:bg-[hsl(0_0%_100%/0.1)]"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Caméra
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-h-[48px] bg-[hsl(0_0%_100%/0.05)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)] hover:bg-[hsl(0_0%_100%/0.1)]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Galerie
                </Button>
              </div>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageCapture} />

              {imagePreview && (
                <Button className="w-full max-w-sm min-h-[48px] bg-primary text-primary-foreground" onClick={() => setStep('details')}>
                  Suivant <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              <Button variant="ghost" className="text-[hsl(0_0%_55%)] text-sm" onClick={() => setStep('details')}>
                Passer cette étape →
              </Button>
            </motion.div>
          )}

          {/* STEP 2: Details */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label className="text-[hsl(0_0%_55%)] text-xs">Nom du produit *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Plaquette de frein Xiaomi Pro 2"
                  className="min-h-[48px] bg-[hsl(0_0%_100%/0.05)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[hsl(0_0%_55%)] text-xs">Catégorie *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="min-h-[48px] bg-[hsl(0_0%_100%/0.05)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)]">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[hsl(0_0%_55%)] text-xs">Prix (€)</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="29.90"
                    className="min-h-[48px] bg-[hsl(0_0%_100%/0.05)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[hsl(0_0%_55%)] text-xs">Stock</Label>
                  <Input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="min-h-[48px] bg-[hsl(0_0%_100%/0.05)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[hsl(0_0%_55%)] text-xs">SKU</Label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="PLQ-BRK-001"
                  className="min-h-[48px] bg-[hsl(0_0%_100%/0.05)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[hsl(0_0%_55%)] text-xs">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description du produit..."
                  rows={3}
                  className="bg-[hsl(0_0%_100%/0.05)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)]"
                />
              </div>

              <Button className="w-full min-h-[48px] bg-primary text-primary-foreground" onClick={() => setStep('specs')}>
                Suivant : Specs <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* STEP 3: Technical Specs */}
          {step === 'specs' && (
            <motion.div
              key="specs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label className="text-[hsl(0_0%_55%)] text-xs">Difficulté d'installation</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="min-h-[48px] bg-[hsl(0_0%_100%/0.05)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)]">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">⭐ Facile</SelectItem>
                    <SelectItem value="2">⭐⭐ Modéré</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ Intermédiaire</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ Avancé</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Summary Card */}
              <div className="admin-glass-card rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-primary">Résumé</h3>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-contain bg-[hsl(0_0%_100%/0.05)]" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium">{name || '—'}</p>
                  <p className="text-xs text-[hsl(0_0%_55%)]">
                    {price ? `${price}€` : 'Prix non défini'} · Stock: {stock || '0'}
                  </p>
                </div>
              </div>

              <Button
                className="w-full min-h-[48px] bg-primary text-primary-foreground"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploading ? 'Upload photo...' : 'Enregistrement...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer la pièce
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminScanner;
