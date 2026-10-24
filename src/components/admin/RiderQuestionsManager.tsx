import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ExternalLink, Check, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { slugifyQuestion } from '@/lib/atelier';

/* 24/10/2026 — « L'Atelier » / Questions des riders (plan claude/PT-lot-atelier-hub.md, A2/A6).
   Une question n'est publique qu'une fois RÉPONDUE ici (titre + réponse). Le brouillon éventuel préparé
   par Claude se relit et se valide : rien n'est publié sans clic de l'atelier. */

type Statut = 'en_attente' | 'repondue' | 'refusee';
interface Row {
  id: string; slug: string | null; scooter_slug: string | null; scooter_name: string | null; question: string;
  email: string | null; statut: Statut; titre: string | null; reponse: string | null; brouillon: string | null;
  repondu_par: string | null; repondu_le: string | null; created_at: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase as unknown as { from: (t: string) => any }).from('rider_questions');
const LABEL: Record<Statut, string> = { en_attente: 'En attente', repondue: 'Publiée', refusee: 'Refusée' };
const ORDER: Record<Statut, number> = { en_attente: 0, repondue: 1, refusee: 2 };

const Card = ({ row }: { row: Row }) => {
  const qc = useQueryClient();
  const [titre, setTitre] = useState(row.titre ?? '');
  const [reponse, setReponse] = useState(row.reponse ?? row.brouillon ?? '');
  const [par, setPar] = useState(row.repondu_par ?? "L'atelier");
  const save = useMutation({
    mutationFn: async (patch: Partial<Row>) => {
      const { error } = await table().update({ ...patch, updated_at: new Date().toISOString() }).eq('id', row.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-rider-questions'] }); qc.invalidateQueries({ queryKey: ['atelier-questions'] }); toast.success('Enregistré'); },
    onError: (e: Error) => toast.error(`Échec : ${e.message}`),
  });
  const publish = () => {
    const t = titre.trim(); const r = reponse.trim();
    if (t.length < 5) { toast.error('Donne un titre (5 caractères minimum), c\'est le titre de la page publique.'); return; }
    if (r.length < 20) { toast.error('La réponse doit faire au moins 20 caractères.'); return; }
    const slug = row.slug ?? `${slugifyQuestion(t)}-${row.id.slice(0, 6)}`;
    save.mutate({ titre: t, reponse: r, repondu_par: par.trim() || null, slug, statut: 'repondue', repondu_le: row.repondu_le ?? new Date().toISOString() });
  };
  return (
    <article className="admin-glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[hsl(var(--admin-text-muted))]">
            {row.scooter_name || 'Trottinette non précisée'} · {new Date(row.created_at).toLocaleDateString('fr-FR')}
          </p>
          <p className="mt-1 text-base text-[hsl(var(--admin-text))] whitespace-pre-line">{row.question}</p>
          {row.email && (
            <a href={`mailto:${row.email}?subject=${encodeURIComponent('Ta question à l\'atelier Pièces Trottinettes')}`} className="mt-1 inline-flex items-center gap-1 min-h-[44px] text-sm font-semibold text-[hsl(var(--admin-accent))]">
              <Mail className="w-4 h-4" /> {row.email}
            </a>
          )}
        </div>
        <span className={cn('shrink-0 px-2.5 py-1 rounded-lg text-sm font-semibold',
          row.statut === 'en_attente' ? 'bg-amber-100 text-amber-900' : row.statut === 'repondue' ? 'bg-[hsl(var(--admin-accent))] text-white' : 'bg-gray-100 text-gray-700')}>{LABEL[row.statut]}</span>
      </div>
      {row.statut !== 'refusee' && (
        <>
          <label className="block">
            <span className="text-sm font-semibold text-[hsl(var(--admin-text))]">Titre de la page publique</span>
            <Input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={140} placeholder="Ex. Pourquoi ma Xiaomi 4 Pro crève souvent à l'arrière ?" className="mt-1 bg-white min-h-[44px] text-base" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[hsl(var(--admin-text))]">Réponse de l'atelier {row.brouillon && !row.reponse ? '(brouillon préparé par Claude, à relire)' : ''}</span>
            <Textarea value={reponse} onChange={(e) => setReponse(e.target.value)} rows={5} maxLength={4000} className="mt-1 bg-white text-base" />
          </label>
          <label className="block max-w-xs">
            <span className="text-sm font-semibold text-[hsl(var(--admin-text))]">Signé</span>
            <Input value={par} onChange={(e) => setPar(e.target.value)} maxLength={60} className="mt-1 bg-white min-h-[44px] text-base" />
          </label>
        </>
      )}
      <div className="flex flex-wrap gap-2">
        {row.statut !== 'refusee' && (
          <button type="button" disabled={save.isPending} onClick={publish}
            className="min-h-[44px] px-4 rounded-xl text-sm font-semibold bg-[hsl(var(--admin-accent))] text-white inline-flex items-center gap-2 disabled:opacity-50">
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {row.statut === 'repondue' ? 'Mettre à jour' : 'Publier la réponse'}
          </button>
        )}
        {row.statut === 'en_attente' && (
          <button type="button" disabled={save.isPending} onClick={() => save.mutate({ statut: 'refusee' })}
            className="min-h-[44px] px-4 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-border))] bg-white inline-flex items-center gap-2">
            <X className="w-4 h-4" /> Refuser (spam, débridage…)
          </button>
        )}
        {row.statut === 'repondue' && row.slug && (
          <a href={`/atelier/questions/${row.slug}`} target="_blank" rel="noopener noreferrer"
            className="min-h-[44px] px-4 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-border))] bg-white inline-flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Voir la page
          </a>
        )}
        {row.statut !== 'en_attente' && (
          <button type="button" disabled={save.isPending} onClick={() => save.mutate({ statut: 'en_attente' })}
            className="min-h-[44px] px-4 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-border))] bg-white">
            Repasser en attente
          </button>
        )}
      </div>
    </article>
  );
};

const RiderQuestionsManager = () => {
  const [filtre, setFiltre] = useState<Statut | 'toutes'>('en_attente');
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['admin-rider-questions'],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await table().select('*').order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      return ((data || []) as Row[]).sort((a, b) => ORDER[a.statut] - ORDER[b.statut]);
    },
  });
  if (isLoading) return <div className="admin-glass-card rounded-2xl p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--admin-text-muted))]" /></div>;
  if (error) return <div className="admin-glass-card rounded-2xl p-4 text-sm text-red-700">Lecture impossible : {(error as Error).message}</div>;
  const n = (k: Statut) => rows.filter((r) => r.statut === k).length;
  const shown = filtre === 'toutes' ? rows : rows.filter((r) => r.statut === filtre);
  return (
    <div className="space-y-4">
      <div className="admin-glass-card rounded-2xl p-4 space-y-3">
        <h3 className="text-base font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">Questions des riders</h3>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">
          Une question n'apparaît sur le site qu'une fois publiée ici. Délai annoncé aux riders : 48 h. Les questions sur le débridage se refusent.
        </p>
        <div className="flex flex-wrap gap-2">
          {(['en_attente', 'repondue', 'refusee', 'toutes'] as const).map((k) => (
            <button key={k} type="button" onClick={() => setFiltre(k)} aria-pressed={filtre === k}
              className={cn('min-h-[44px] px-4 rounded-xl text-sm font-semibold border',
                filtre === k ? 'bg-[hsl(var(--admin-accent))] text-white border-transparent' : 'bg-white border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text))]')}>
              {k === 'toutes' ? `Toutes ${rows.length}` : `${LABEL[k]} ${n(k)}`}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="admin-glass-card rounded-2xl p-4 text-sm text-[hsl(var(--admin-text-muted))]">
          {filtre === 'en_attente' ? 'Aucune question en attente.' : 'Rien dans cette liste.'}
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">{shown.map((r) => <Card key={r.id} row={r} />)}</div>
      )}
    </div>
  );
};

export default RiderQuestionsManager;
