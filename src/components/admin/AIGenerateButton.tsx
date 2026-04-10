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

const SYSTEM_PROMPT =
  "Tu es expert SEO e-commerce spécialisé pièces détachées trottinettes électriques France. Génère du contenu optimisé SEO, concis et orienté conversion. Réponds uniquement avec le texte demandé, sans guillemets ni explication.";

function buildUserPrompt(field: Field, ctx: AIGenerateButtonProps['context']): string {
  const models = ctx.compatible_models?.filter(Boolean).join(', ') || '';
  const specs = [
    ctx.power_watts ? `${ctx.power_watts}W` : '',
    ctx.voltage ? `${ctx.voltage}V` : '',
    ctx.range_km ? `${ctx.range_km}km autonomie` : '',
    ctx.max_speed_kmh ? `${ctx.max_speed_kmh}km/h` : '',
    ctx.tire_size || '',
  ].filter(Boolean).join(', ');

  if (field === 'description') {
    return `Génère une description produit de 80 à 120 mots pour : "${ctx.name}".
${ctx.category ? `Catégorie : ${ctx.category}.` : ''}
${models ? `Trottinettes compatibles : ${models}.` : ''}
${specs ? `Caractéristiques : ${specs}.` : ''}
${ctx.brand ? `Marque : ${ctx.brand}.` : ''}
Inclure les modèles compatibles, les caractéristiques techniques clés, et le bénéfice principal pour l'acheteur.`;
  }

  if (field === 'meta_title') {
    return `Génère un meta title SEO de 60 caractères maximum pour : "${ctx.name}".
${models ? `Modèles compatibles : ${models}.` : ''}
Format : [Nom Pièce] [Modèles compatibles] | Pièces Trottinettes`;
  }

  if (field === 'meta_description') {
    return `Génère une meta description SEO de 155 caractères maximum pour : "${ctx.name}".
${models ? `Modèles compatibles : ${models}.` : ''}
${ctx.category ? `Catégorie : ${ctx.category}.` : ''}
Inclure les modèles compatibles et un CTA "Livraison rapide".`;
  }

  return '';
}

const FIELD_LABELS: Record<Field, string> = {
  description: 'description',
  meta_title: 'meta title',
  meta_description: 'meta description',
};

const AIGenerateButton = ({ field, context, onGenerated }: AIGenerateButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      toast.error('VITE_ANTHROPIC_API_KEY manquant dans .env');
      return;
    }

    if (!context.name) {
      toast.error('Le nom du produit est requis pour générer du contenu.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildUserPrompt(field, context) }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Erreur ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text?.trim();
      if (!text) throw new Error('Réponse vide de l\'IA');

      onGenerated(text);
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
