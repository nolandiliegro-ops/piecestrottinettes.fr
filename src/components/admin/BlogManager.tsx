import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ExternalLink, Plus, Check, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/* 24/10/2026 (Nolan, choix « Écran Blog dans l'admin ») — file éditoriale du blog.
   Nolan écrit (ou dicte au clavier du téléphone) ce qu'il voit à l'atelier pour chaque article,
   puis clique « Prêt à rédiger ». La tâche du lundi (ou une conversation) lit les articles
   « À rédiger », rédige public/blog/<slug>.json avec ces observations dans l'encadré « Vu à l'atelier »,
   publie, puis passe la ligne en « Publié ». Table public.blog_articles (RLS admin). */

type Statut = 'idee' | 'a_rediger' | 'publie';
type Rubrique = "Guide d'achat" | 'Comparatif' | 'Choisir dans une gamme' | 'Entretien';
interface BlogRow { id: string; slug: string; titre: string; rubrique: Rubrique; statut: Statut; notes_atelier: string | null; publie_le: string | null; updated_at: string }

const STATUTS: { k: Statut; label: string; cls: string }[] = [
  { k: 'a_rediger', label: 'À rédiger', cls: 'bg-amber-100 text-amber-900' },
  { k: 'idee', label: 'Idée', cls: 'bg-gray-100 text-gray-700' },
  { k: 'publie', label: 'Publié', cls: 'bg-[hsl(var(--admin-accent))] text-white' },
];
const ORDRE: Record<Statut, number> = { a_rediger: 0, idee: 1, publie: 2 };
const RUBRIQUES: Rubrique[] = ["Guide d'achat", 'Comparatif', 'Choisir dans une gamme', 'Entretien'];

// Table absente des types générés : accès non typé.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase as unknown as { from: (t: string) => any }).from('blog_articles');

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);

const Card = ({ row }: { row: BlogRow }) => {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(row.notes_atelier ?? '');
  const dirty = notes !== (row.notes_atelier ?? '');
  const save = useMutation({
    mutationFn: async (patch: Partial<BlogRow>) => {
      const { error } = await table().update({ ...patch, updated_at: new Date().toISOString() }).eq('id', row.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blog-articles'] }); toast.success('Enregistré'); },
    onError: (e: Error) => toast.error(`Échec : ${e.message}`),
  });
  const st = STATUTS.find(s => s.k === row.statut)!;
  return (
    <article className="admin-glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--admin-text-muted))]">{row.rubrique}</p>
          <h4 className="text-base font-black text-[hsl(var(--admin-text))] leading-snug">{row.titre}</h4>
        </div>
        <span className={cn('shrink-0 px-2.5 py-1 rounded-lg text-sm font-semibold', st.cls)}>{st.label}</span>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-[hsl(var(--admin-text))]">Ce que tu vois à l'atelier</span>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
          placeholder="Ex. : sur la Xiaomi 5 Max, ce qui casse en premier… les clients reviennent pour… le pneu qu'on remplace le plus…"
          className="mt-1 bg-white text-base" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!dirty || save.isPending} onClick={() => save.mutate({ notes_atelier: notes.trim() || null })}
          className="min-h-[44px] px-4 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-border))] bg-white disabled:opacity-40 inline-flex items-center gap-2">
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enregistrer
        </button>
        {row.statut === 'idee' && (
          <button type="button" disabled={save.isPending} onClick={() => save.mutate({ notes_atelier: notes.trim() || null, statut: 'a_rediger' })}
            className="min-h-[44px] px-4 rounded-xl text-sm font-semibold bg-[hsl(var(--admin-accent))] text-white inline-flex items-center gap-2">
            <PenLine className="w-4 h-4" /> Prêt à rédiger
          </button>
        )}
        {row.statut === 'a_rediger' && (
          <button type="button" disabled={save.isPending} onClick={() => save.mutate({ statut: 'idee' })}
            className="min-h-[44px] px-4 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-border))] bg-white">
            Remettre en idée
          </button>
        )}
        {row.statut === 'publie' && (
          <a href={`/blog/${row.slug}`} target="_blank" rel="noopener noreferrer"
            className="min-h-[44px] px-4 rounded-xl text-sm font-semibold border border-[hsl(var(--admin-border))] bg-white inline-flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Voir l'article
          </a>
        )}
      </div>
      {row.statut === 'publie' && dirty && (
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">Une observation ajoutée sur un article publié sera intégrée au prochain passage (encadré « Vu à l'atelier »).</p>
      )}
    </article>
  );
};

const BlogManager = () => {
  const qc = useQueryClient();
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['blog-articles'],
    queryFn: async (): Promise<BlogRow[]> => {
      const { data, error } = await table().select('*');
      if (error) throw error;
      return ((data || []) as BlogRow[]).sort((a, b) => ORDRE[a.statut] - ORDRE[b.statut] || a.titre.localeCompare(b.titre));
    },
  });
  const [titre, setTitre] = useState('');
  const [rubrique, setRubrique] = useState<Rubrique>("Guide d'achat");
  const add = useMutation({
    mutationFn: async () => {
      const t = titre.trim();
      const { error } = await table().insert({ titre: t, slug: slugify(t), rubrique, statut: 'idee' });
      if (error) throw error;
    },
    onSuccess: () => { setTitre(''); qc.invalidateQueries({ queryKey: ['blog-articles'] }); toast.success('Idée ajoutée'); },
    onError: (e: Error) => toast.error(`Échec : ${e.message}`),
  });

  if (isLoading) return <div className="admin-glass-card rounded-2xl p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--admin-text-muted))]" /></div>;
  if (error) return <div className="admin-glass-card rounded-2xl p-4 text-sm text-red-700">Lecture impossible : {(error as Error).message}</div>;

  const count = (k: Statut) => rows.filter(r => r.statut === k).length;
  return (
    <div className="space-y-4">
      <div className="admin-glass-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">Blog de l'atelier</h3>
          <span className="text-sm text-[hsl(var(--admin-text-muted))] tabular-nums">
            {count('publie')} publiés · {count('a_rediger')} à rédiger · {count('idee')} idées
          </span>
        </div>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">
          Écris ce que tu vois à l'atelier sous un article, puis « Prêt à rédiger ». Chaque lundi, Claude rédige les articles prêts, les publie sur /blog et les passe en « Publié ».
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Nouvelle idée d'article (titre)" className="bg-white min-h-[44px] text-base" aria-label="Titre de l'idée" />
          <select value={rubrique} onChange={e => setRubrique(e.target.value as Rubrique)} aria-label="Rubrique"
            className="min-h-[44px] rounded-xl border border-[hsl(var(--admin-border))] bg-white px-3 text-sm">
            {RUBRIQUES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="button" disabled={titre.trim().length < 3 || add.isPending} onClick={() => add.mutate()}
            className="min-h-[44px] px-4 rounded-xl text-sm font-semibold bg-[hsl(var(--admin-accent))] text-white disabled:opacity-40 inline-flex items-center justify-center gap-2">
            {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Ajouter
          </button>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map(r => <Card key={r.id} row={r} />)}
      </div>
    </div>
  );
};

export default BlogManager;
