import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/* 20/10/2026 (Nolan) — « À trancher » : questions fermées à régler au magasin (doublons de
   plaquettes, pneus 200x50, tailles où deux boutiques se contredisent, versions et tensions).
   Table public.atelier_questions (RLS admin). Une réponse ne touche PAS le catalogue : Claude
   relit les réponses, propose les clés, écrit après go, puis passe la question en « traitee ». */

export interface AtelierQuestion {
  id: string; famille: string; ordre: number; titre: string; contexte: string | null; regarder: string | null;
  choix: string[]; reponse: string | null; note: string | null; repondu_le: string | null; traitee: boolean;
  source: string | null; scooter_slug: string | null; cle: string | null; created_at: string;
}

const FAMILLES: { k: string; label: string }[] = [
  { k: 'doublons', label: 'Doublons plaquettes' },
  { k: '200x50', label: 'Pneus 200x50' },
  { k: 'contradictions', label: 'Boutiques en désaccord' },
  { k: 'variantes', label: 'Versions et tensions' },
  { k: 'prises', label: 'Prises de charge' },
  { k: 'base', label: 'Erreurs probables de la base' },
];
const SOURCE: Record<string, string> = { claude: 'Claude', 'campagne-cles': 'Campagne de clés', robot: 'Robot', moteur: 'Moteur' };
const CLE: Record<string, string> = { v: 'tension', rim: 'jante', sec: 'taille de pneu', cc: 'prise', brake: 'frein', dd: 'disque', cal: 'étrier' };
const isNew = (q: AtelierQuestion) => !q.traitee && Date.now() - new Date(q.created_at).getTime() < 72 * 3600 * 1000;
const PAS_UNE_REPONSE = /je ne sais pas|pas au magasin|sous la main/i;

// Table absente des types générés : accès non typé.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase as unknown as { from: (t: string) => any }).from('atelier_questions');

export const useAtelierQuestions = () => useQuery({
  queryKey: ['atelier-questions'],
  staleTime: 60_000,
  queryFn: async (): Promise<AtelierQuestion[]> => {
    const { data, error } = await table().select('id, famille, ordre, titre, contexte, regarder, choix, reponse, note, repondu_le, traitee, source, scooter_slug, cle, created_at').order('ordre');
    if (error) throw error;
    return (data || []) as AtelierQuestion[];
  },
});
export const isAnswered = (q: AtelierQuestion) => !!(q.reponse && !PAS_UNE_REPONSE.test(q.reponse)) || !!q.note?.trim();

const QuestionCard = ({ q, onOpenScooter }: { q: AtelierQuestion; onOpenScooter?: (slug: string) => void }) => {
  const qc = useQueryClient();
  const [note, setNote] = useState(q.note ?? '');
  const save = useMutation({
    mutationFn: async (patch: Partial<AtelierQuestion>) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await table().update({ ...patch, repondu_le: new Date().toISOString(), repondu_par: u.user?.id ?? null }).eq('id', q.id);
      if (error) throw error;
    },
    onError: (e: Error) => toast.error(`Pas enregistré : ${e.message}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ['atelier-questions'] }),
  });
  const done = isAnswered(q);
  return (
    <article className={cn('admin-glass-card rounded-2xl p-4 space-y-2.5 border', done ? 'border-[hsl(var(--admin-accent))]' : 'border-transparent')}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-[15px] font-black uppercase leading-tight text-[hsl(var(--admin-text))]">{q.titre}</h4>
        {q.traitee
          ? <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-[hsl(var(--admin-accent))] text-white">Traitée</span>
          : done ? <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-[hsl(var(--admin-accent)/0.15)] text-[hsl(var(--admin-accent))]">Répondu</span>
          : isNew(q) && <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500 text-white">Nouvelle</span>}
      </div>
      <p className="text-xs text-[hsl(var(--admin-text-muted))]">
        Ajoutée par {SOURCE[q.source ?? 'claude'] ?? q.source} le {new Date(q.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        {q.cle && <> · remplit la clé <strong>{CLE[q.cle] ?? q.cle}</strong></>}
      </p>
      {q.contexte && <p className="text-sm text-[hsl(var(--admin-text))]">{q.contexte}</p>}
      {q.regarder && (
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">
          <span className="font-semibold text-orange-700">Où regarder · </span>{q.regarder}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {q.choix.map(c => (
          <button
            key={c}
            disabled={save.isPending || q.traitee}
            onClick={() => save.mutate({ reponse: q.reponse === c ? null : c })}
            aria-pressed={q.reponse === c}
            className={cn('min-h-[44px] px-3.5 rounded-xl text-sm font-semibold border text-left transition-colors disabled:opacity-60',
              q.reponse === c
                ? 'bg-[hsl(var(--admin-accent))] text-white border-transparent'
                : 'bg-white text-[hsl(var(--admin-text))] border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--aov03))]')}
          >
            {c}
          </button>
        ))}
      </div>
      <Input
        value={note}
        onChange={e => setNote(e.target.value)}
        onBlur={() => { if (note !== (q.note ?? '')) save.mutate({ note: note.trim() || null }); }}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        disabled={q.traitee}
        placeholder="Note : taille lue sur le flanc, remarque…"
        aria-label={`Note pour ${q.titre}`}
        className="bg-white min-h-[44px]"
      />
      {q.scooter_slug && onOpenScooter && (
        <button onClick={() => onOpenScooter(q.scooter_slug as string)}
          className="min-h-[40px] px-3 rounded-lg border border-[hsl(var(--admin-border))] bg-white text-sm font-semibold text-[hsl(var(--admin-text))]">
          Ouvrir la trottinette dans le Studio →
        </button>
      )}
      <p className="text-xs text-[hsl(var(--admin-text-muted))] min-h-[16px]">
        {save.isPending ? 'Enregistrement…' : q.repondu_le ? `Mis à jour le ${new Date(q.repondu_le).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
      </p>
    </article>
  );
};

const AtelierQuestionsPanel = ({ onOpenScooter }: { onOpenScooter?: (slug: string) => void }) => {
  const { data: qs = [], isLoading } = useAtelierQuestions();
  const [hideDone, setHideDone] = useState(false);
  if (isLoading) return <div className="admin-glass-card rounded-2xl p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--admin-text-muted))]" /></div>;
  const open = qs.filter(q => !q.traitee);
  return (
    <div className="space-y-4">
      <div className="admin-glass-card rounded-2xl p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">À trancher au magasin</h3>
          <span className="text-sm text-[hsl(var(--admin-text-muted))] tabular-nums">{open.filter(isAnswered).length}/{open.length} répondues</span>
        </div>
        <p className="text-sm text-[hsl(var(--admin-text-muted))] mt-1">Claude ajoute ici chaque question qu'il ne peut pas trancher seul. Réponds d'un tap, ajoute une note si besoin. Rien ne change sur le site tant que Claude n'a pas relu tes réponses et posé les clés avec ton go.</p>
        <label className="mt-3 flex items-center gap-2 min-h-[44px] text-sm text-[hsl(var(--admin-text-muted))]">
          <input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} className="w-5 h-5 accent-[hsl(var(--admin-accent))]" />
          Masquer les questions répondues
        </label>
      </div>
      {FAMILLES.map(f => {
        const items = qs.filter(q => q.famille === f.k && !(hideDone && (isAnswered(q) || q.traitee)));
        const all = qs.filter(q => q.famille === f.k);
        if (!all.length) return null;
        return (
          <section key={f.k} className="space-y-2.5">
            <h3 className="px-1 text-sm font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">
              {f.label} · <span className="tabular-nums">{all.filter(isAnswered).length}/{all.length}</span>
            </h3>
            {items.length ? items.map(q => <QuestionCard key={`${q.id}-${q.repondu_le ?? ''}`} q={q} onOpenScooter={onOpenScooter} />)
              : <p className="px-1 text-sm text-[hsl(var(--admin-text-muted))]">Tout est répondu ici.</p>}
          </section>
        );
      })}
    </div>
  );
};

export default AtelierQuestionsPanel;
