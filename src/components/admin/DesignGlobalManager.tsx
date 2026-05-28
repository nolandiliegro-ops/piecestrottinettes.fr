import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, History, ChevronDown, RefreshCw } from 'lucide-react';
import { ColorPickerInput } from './design-global/ColorPickerInput';

interface DesignTokenRow {
  key: string;
  value: string;
  label: string | null;
  category: string;
  display_order: number;
  type: string;
}

interface HistoryRow {
  id: string;
  token_key: string;
  old_value: string | null;
  new_value: string | null;
  action: string;
  changed_at: string;
}

// V1 section layout — defines which tokens are editable and which are V2-disabled.
type FieldSpec = {
  key: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
};

const SECTIONS: { id: string; title: string; fields: FieldSpec[] }[] = [
  {
    id: 'global',
    title: 'GLOBAL',
    fields: [
      { key: 'global.background', label: 'Fond app' },
      { key: 'global.text-primary', label: 'Texte principal' },
      { key: 'global.text-secondary', label: 'Texte secondaire' },
    ],
  },
  {
    id: 'header',
    title: 'HEADER',
    fields: [
      { key: 'header.text', label: 'Texte Header' },
      {
        key: 'header.background',
        label: 'Fond Header',
        disabled: true,
        disabledReason:
          "Le fond du header utilise le système Tailwind HSL, théméable en V2",
      },
    ],
  },
  {
    id: 'hero',
    title: 'HERO',
    fields: [{ key: 'hero.background', label: 'Fond Hero' }],
  },
  {
    id: 'brands',
    title: 'MARQUES',
    fields: [
      { key: 'brands.card-background', label: 'Fond cards marque' },
      { key: 'brands.card-surround', label: 'Fond capsule marques' },
    ],
  },
  {
    id: 'popular',
    title: 'POPULAIRES',
    fields: [
      { key: 'popular.card-background', label: 'Fond cards' },
      { key: 'popular.section-background', label: 'Fond section' },
    ],
  },
];

const PREVIEW_URL = '/';

export default function DesignGlobalManager() {
  const qc = useQueryClient();
  const [localChanges, setLocalChanges] = useState<Record<string, string>>({});
  const [iframeKey, setIframeKey] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['design_tokens_admin'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('design_tokens')
        .select('key, value, label, category, display_order, type')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as DesignTokenRow[];
    },
  });

  const { data: history } = useQuery({
    queryKey: ['design_tokens_history'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('design_tokens_history')
        .select('id, token_key, old_value, new_value, action, changed_at')
        .order('changed_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
    staleTime: 0,
  });

  const publishedMap = useMemo(() => {
    const m: Record<string, string> = {};
    (tokens ?? []).forEach((t) => (m[t.key] = t.value));
    return m;
  }, [tokens]);

  const valueFor = (key: string) => localChanges[key] ?? publishedMap[key] ?? '#000000';

  const setValue = (key: string, next: string) => {
    setLocalChanges((prev) => {
      const cleaned = { ...prev };
      if ((publishedMap[key] ?? '').toUpperCase() === next.toUpperCase()) {
        delete cleaned[key];
      } else {
        cleaned[key] = next;
      }
      return cleaned;
    });
  };

  const pendingCount = Object.keys(localChanges).length;

  const publishMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(localChanges);
      const results = await Promise.all(
        entries.map(([key, value]) =>
          (supabase as any)
            .from('design_tokens')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key)
        )
      );
      const failed = results.filter((r) => r.error);
      if (failed.length) throw new Error(failed[0].error.message);
    },
    onSuccess: () => {
      toast.success(`${pendingCount} token${pendingCount > 1 ? 's' : ''} publié${pendingCount > 1 ? 's' : ''}`);
      setLocalChanges({});
      qc.invalidateQueries({ queryKey: ['design_tokens_admin'] });
      qc.invalidateQueries({ queryKey: ['design_tokens_history'] });
      qc.invalidateQueries({ queryKey: ['design-tokens'] });
      setIframeKey((k) => k + 1);
    },
    onError: (e: any) => {
      toast.error(e?.message ?? 'Erreur de publication');
    },
  });

  const restoreFromHistory = (h: HistoryRow) => {
    if (!h.old_value) return;
    setValue(h.token_key, h.old_value);
    toast.info('Valeur restaurée — clique Publier pour appliquer');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">DESIGN GLOBAL</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Modifie les couleurs des zones de ton site. Les changements s'appliquent en temps réel sans rebuild.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT — editor */}
        <div className="lg:col-span-3 space-y-3">
          <Accordion type="multiple" defaultValue={SECTIONS.map((s) => s.id)} className="space-y-2">
            {SECTIONS.map((section) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border border-border rounded-xl px-4 bg-card"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <span className="text-xs font-bold tracking-[0.18em] text-foreground">{section.title}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="divide-y divide-border">
                    {section.fields.map((f) => (
                      <ColorPickerInput
                        key={f.key}
                        label={f.label}
                        value={valueFor(f.key)}
                        publishedValue={publishedMap[f.key] ?? '#000000'}
                        onChange={(v) => setValue(f.key, v)}
                        disabled={f.disabled}
                        disabledReason={f.disabledReason}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <p className="text-xs text-muted-foreground italic px-1 pt-2">
            Footer et fond Header théméables en V2 (Design System Manager complet)
          </p>
        </div>

        {/* RIGHT — preview iframe */}
        <div className="lg:col-span-2">
          <div className="sticky top-4">
            <div className="rounded-2xl border border-border overflow-hidden bg-muted/20">
              <iframe
                key={iframeKey}
                src={PREVIEW_URL}
                title="Preview Home"
                className="w-full h-[400px] lg:h-[600px] border-0"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" /> Preview en temps réel — recharge auto après publication
            </p>
          </div>
        </div>
      </div>

      {/* Historique */}
      <div className="mt-8 border border-border rounded-xl bg-card">
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30 transition-colors rounded-xl">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Historique</span>
              <Badge variant="secondary" className="text-[10px]">{history?.length ?? 0}</Badge>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${historyOpen ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-1 space-y-2">
              {(history ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground py-3">Aucun changement encore.</p>
              )}
              {(history ?? []).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-3 text-xs py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-muted-foreground shrink-0">
                      Il y a {formatDistanceToNow(new Date(h.changed_at), { locale: fr })}
                    </span>
                    <span className="font-mono text-foreground truncate">{h.token_key}</span>
                    <span className="text-muted-foreground">:</span>
                    {h.old_value && (
                      <span className="flex items-center gap-1">
                        <span
                          className="inline-block w-3 h-3 rounded-sm border border-border"
                          style={{ background: h.old_value }}
                        />
                        <span className="font-mono">{h.old_value}</span>
                      </span>
                    )}
                    <span className="text-muted-foreground">→</span>
                    {h.new_value && (
                      <span className="flex items-center gap-1">
                        <span
                          className="inline-block w-3 h-3 rounded-sm border border-border"
                          style={{ background: h.new_value }}
                        />
                        <span className="font-mono">{h.new_value}</span>
                      </span>
                    )}
                  </div>
                  {h.action === 'UPDATE' && h.old_value && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs shrink-0"
                      onClick={() => restoreFromHistory(h)}
                    >
                      Restaurer
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Sticky publish bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            {pendingCount > 0 ? (
              <>
                <Badge variant="default" className="bg-orange-500 hover:bg-orange-500">
                  {pendingCount}
                </Badge>
                <span className="text-foreground">
                  changement{pendingCount > 1 ? 's' : ''} non publié{pendingCount > 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Aucun changement en attente</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pendingCount === 0 || publishMutation.isPending}
              onClick={() => setLocalChanges({})}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              disabled={pendingCount === 0 || publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              {publishMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              Publier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
