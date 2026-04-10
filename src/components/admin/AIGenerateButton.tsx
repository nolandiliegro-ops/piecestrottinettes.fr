import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Field = 'description' | 'meta_title' | 'meta_description';

interface AIGenerateButtonProps {
  field: Field;
  context: {
    name?: string;
    description?: string;
    category?: string;
    compatible_models?: string[];
    brand?: string;
    power_watts?: number | string | null;
    voltage?: number | string | null;
    range_km?: number | string | null;
    tire_size?: string | null;
    max_speed_kmh?: number | string | null;
  };
  onGenerated: (text: string) => void;
}

const EDGE_FUNCTION_URL = 'https://kqsxscjtlipregkrmucg.supabase.co/functions/v1/generate-seo';

const FIELD_LABELS: Record<Field, string> = {
  description: 'description',
  meta_title: 'meta title',
  meta_description: 'meta description',
};

const AIGenerateButton = ({ field, context, onGenerated }: AIGenerateButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!context.name) {
      toast.error('Le nom du produit est requis pour générer du contenu.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          type: context.compatible_models !== undefined ? 'part' : 'scooter',
          field,
          data: {
            name: context.name,
            ...(context.category && { category: context.category }),
            ...(context.brand && { brand: context.brand }),
            ...(context.compatible_models?.length && { compatible_models: context.compatible_models }),
            ...(context.power_watts && { power_watts: context.power_watts }),
            ...(context.voltage && { voltage: context.voltage }),
            ...(context.range_km && { range_km: context.range_km }),
            ...(context.tire_size && { tire_size: context.tire_size }),
            ...(context.max_speed_kmh && { max_speed_kmh: context.max_speed_kmh }),
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error || `Erreur ${res.status}`);
      }

      const data = await res.json();
      if (!data.generated) throw new Error('Réponse vide de l\'IA');

      onGenerated(data.generated);
      toast.success(`${FIELD_LABELS[field]} généré`);
    } catch (e: any) {
      toast.error(`Erreur IA : ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={loading}
      className="h-7 px-2 gap-1 text-xs border-green-700/30 text-green-700 hover:bg-green-700/10 hover:text-green-800"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      IA
    </Button>
  );
};

export default AIGenerateButton;
