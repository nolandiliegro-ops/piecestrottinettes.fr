import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, History, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react';
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
        disabledReason: "Le fond du header utilise le système Tailwind HSL, théméable en V2",
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeReadyRef = useRef(false);
  const pendingChangesRef = useRef<Record<string, string>>({});
  const rafRef = useRef<number | null>(null);

  // Keep ref in sync with state (used by handlers without re-binding)
  useEffect(() => {
    pendingChangesRef.current = localChanges;
  }, [localChanges]);

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

  // --- POSTMESSAGE LIVE PREVIEW ---
  const sendPreview = (next: Record<string, string>) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const win = iframeRef.current?.contentWindow;
      if (!win || !iframeReadyRef.current) return;
      try {
        win.postMessage(
          { type: 'design-tokens-preview', tokens: next },
          window.location.origin
        );
      } catch {
        /* noop */
      }
    });
  };

  const handleIframeLoad = () => {
    iframeReadyRef.current = true;
    // Flush current state on (re)load
    sendPreview(pendingChangesRef.current);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const setValue = (key: string, next: string) => {
    setLocalChanges((prev) => {
      const cleaned = { ...prev };
      if ((publishedMap[key] ?? '').toUpperCase() === next.toUpperCase()) {
        delete cleaned[key];
      } else {
        cleaned[key] = next;
      }
      sendPreview(cleaned);
      return cleaned;
    });
  };

  const pendingCount = Object.keys(localChanges).length;

  const publishMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(localChanges);
      const results = await Promise.all(
        entries.map(async ([key, value]) => {
          const res = await (supabase as any)
            .from('design_tokens')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key);
          return { key, error: res.error };
        })
      );
      const failed = results.filter((r) => r.error);
      const succeededKeys = results.filter((r) => !r.error).map((r) => r.key);
      return { succeededKeys, failed };
    },
    onSuccess: ({ succeededKeys, failed }) => {
      // Remove succeeded keys from localChanges, keep failed ones
      setLocalChanges((prev) => {
        const next = { ...prev };
        for (const k of succeededKeys) delete next[k];
        sendPreview(next);
        return next;
      });

      if (failed.length === 0) {
        toast.success(
          `${succeededKeys.length} token${succeededKeys.length > 1 ? 's' : ''} publié${succeededKeys.length > 1 ? 's' : ''}`
        );
      } else {
        toast.error(
          `${failed.length}/${succeededKeys.length + failed.length} échec(s) : ${failed.map((f) => f.key).join(', ')}`
        );
      }

      qc.invalidateQueries({ queryKey: ['design_tokens_admin'] });
      qc.invalidateQueries({ queryKey: ['design_tokens_history'] });
      qc.invalidateQueries({ queryKey: ['design-tokens'] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? 'Erreur de publication');
    },
  });

  const performCancel = () => {
    setLocalChanges({});
    sendPreview({});
    setCancelDialogOpen(false);
  };

  const requestCancel = () => {
    if (pendingCount === 0) return;
    if (pendingCount > 3) {
      setCancelDialogOpen(true);
    } else {
      performCancel();
    }
  };

  const triggerPublish = () => {
    if (pendingCount === 0 || publishMutation.isPending) return;
    publishMutation.mutate();
  };

  // --- KEYBOARD SHORTCUTS ⌘S / Esc ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isSave = (e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S');
      if (isSave) {
        e.preventDefault();
        triggerPublish();
        return;
      }
      if (e.key === 'Escape') {
        if (cancelDialogOpen) return; // let dialog handle it
        requestCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCount, publishMutation.isPending, cancelDialogOpen]);

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
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">DESIGN GLOBAL</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Modifie les couleurs des zones de ton site. Aperçu en temps réel — publie pour appliquer.
        </p>
      </div>

      {/* Sticky action bar (TOP) — always visible while editing */}
      <div className="sticky top-0 z-40 -mx-4 px-4 md:-mx-6 md:px-6 py-3 mb-6 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm min-w-0">
            {pendingCount > 0 ? (
              <>
                <Badge className="bg-orange-500 hover:bg-orange-500 animate-pulse gap-1 text-white">
                  <AlertCircle className="w-3 h-3" />
                  {pendingCount}
                </Badge>
                <span className="text-foreground truncate">
                  changement{pendingCount > 1 ? 's' : ''} non publié{pendingCount > 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Aucune modification en attente</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline text-[11px] text-muted-foreground/80 mr-2">
              ⌘S publier · Esc annuler
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pendingCount === 0 || publishMutation.isPending}
              onClick={requestCancel}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              disabled={pendingCount === 0 || publishMutation.isPending}
              onClick={triggerPublish}
              className="bg-[#4A7C59] hover:bg-[#3A6449] text-white"
            >
              {publishMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              Publier{pendingCount > 0 ? ` (${pendingCount})` : ''}
            </Button>
          </div>
        </div>
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
                ref={iframeRef}
                onLoad={handleIframeLoad}
                src={PREVIEW_URL}
                title="Preview Home"
                className="w-full h-[400px] lg:h-[600px] border-0"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" /> Preview en temps réel pendant l'édition
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
                  className="flex items-center justify-between gap-3 text-xs py-2.5 border-b border-border/60 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-muted-foreground shrink-0">
                      Il y a {formatDistanceToNow(new Date(h.changed_at), { locale: fr })}
                    </span>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="font-mono text-foreground truncate">{h.token_key}</span>
                    <span className="text-muted-foreground/60">·</span>
                    {h.old_value && (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block w-3.5 h-3.5 rounded ring-1 ring-border/70 shadow-sm"
                          style={{ background: h.old_value }}
                        />
                        <span className="font-mono text-foreground/90">{h.old_value}</span>
                      </span>
                    )}
                    <span className="text-muted-foreground">→</span>
                    {h.new_value && (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block w-3.5 h-3.5 rounded ring-1 ring-border/70 shadow-sm"
                          style={{ background: h.new_value }}
                        />
                        <span className="font-mono text-foreground">{h.new_value}</span>
                      </span>
                    )}
                  </div>
                  {h.action === 'UPDATE' && h.old_value && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs shrink-0 text-foreground hover:bg-muted"
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




      {/* Cancel confirm dialog (>3 changements) */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler {pendingCount} changements ?</AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les modifications en cours seront perdues. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Garder</AlertDialogCancel>
            <AlertDialogAction onClick={performCancel}>Annuler les modifs</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
