import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/* 20/10/2026 (Nolan) — « Absentes du site » : une trottinette vue au magasin qui n'est pas au
   catalogue. File d'import tenue à la main. Table public.scooters_absents (RLS admin, doublon
   marque + modèle refusé par un index unique en base). */

type Status = 'a_importer' | 'importee' | 'ecartee';
interface Absent { id: string; brand_name: string | null; model_name: string; notes: string | null; status: Status; created_at: string }

const STATUS: Record<Status, { label: string; cls: string }> = {
  a_importer: { label: 'À importer', cls: 'bg-orange-100 text-orange-800' },
  importee: { label: 'Importée', cls: 'bg-[hsl(var(--admin-accent)/0.15)] text-[hsl(var(--admin-accent))]' },
  ecartee: { label: 'Écartée', cls: 'bg-[hsl(var(--al15))] text-[hsl(var(--admin-text-muted))]' },
};
const NEXT: Record<Status, Status> = { a_importer: 'importee', importee: 'ecartee', ecartee: 'a_importer' };

// Table absente des types générés : accès non typé, résultat recasté.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase as unknown as { from: (t: string) => any }).from('scooters_absents');

export const useAbsents = () => useQuery({
  queryKey: ['scooters-absents'],
  staleTime: 60_000,
  queryFn: async (): Promise<Absent[]> => {
    const { data, error } = await table().select('id, brand_name, model_name, notes, status, created_at').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as Absent[];
  },
});

const AbsentsPanel = ({ brands, defaultBrand }: { brands: string[]; defaultBrand?: string | null }) => {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useAbsents();
  const [brand, setBrand] = useState(defaultBrand ?? '');
  const [model, setModel] = useState('');
  const [notes, setNotes] = useState('');
  const [showAll, setShowAll] = useState(false);

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await table().insert({ brand_name: brand.trim() || null, model_name: model.trim(), notes: notes.trim() || null } );
      if (error) throw error;
    },
    onSuccess: () => { setModel(''); setNotes(''); toast.success('Ajoutée aux absentes'); },
    onError: (e: Error & { code?: string }) => toast.error(e.code === '23505' || e.message.includes('duplicate') ? 'Déjà dans la liste' : `Échec : ${e.message}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ['scooters-absents'] }),
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await table().update({ status } ).eq('id', id);
      if (error) throw error;
    },
    onError: (e: Error) => toast.error(`Échec : ${e.message}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ['scooters-absents'] }),
  });

  const open = rows.filter(r => r.status === 'a_importer');
  const shown = (showAll ? rows : open).filter(r => !defaultBrand || r.brand_name === defaultBrand);

  return (
    <div className="admin-glass-card rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">Absentes du site</h3>
        <span className="text-sm text-[hsl(var(--admin-text-muted))] tabular-nums">{open.length} à importer</span>
      </div>
      <p className="text-sm text-[hsl(var(--admin-text-muted))]">Une trottinette vue au magasin qui n'est pas au catalogue : note-la ici, elle part dans la file d'import.</p>
      <form
        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2"
        onSubmit={e => { e.preventDefault(); if (model.trim()) add.mutate(); }}
      >
        <datalist id="absents-brands">{brands.map(b => <option key={b} value={b} />)}</datalist>
        <Input list="absents-brands" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Marque" aria-label="Marque" className="bg-white min-h-[44px]" />
        <Input value={model} onChange={e => setModel(e.target.value)} placeholder="Modèle (ex. EON X Air)" aria-label="Modèle" className="bg-white min-h-[44px]" />
        <button type="submit" disabled={!model.trim() || add.isPending}
          className="min-h-[44px] px-4 rounded-lg bg-[hsl(var(--admin-accent))] text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
          {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Ajouter
        </button>
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ce que tu sais : pneu, prise, tension…" aria-label="Détails" className="bg-white min-h-[44px] sm:col-span-3" />
      </form>
      <div className="flex items-center gap-1.5">
        {([{ v: false, l: 'À importer' }, { v: true, l: 'Toutes' }] as const).map(o => (
          <button key={o.l} onClick={() => setShowAll(o.v)}
            className={cn('px-3 min-h-[36px] rounded-full text-xs font-semibold border',
              showAll === o.v ? 'bg-[hsl(var(--admin-text))] text-white border-transparent' : 'bg-white text-[hsl(var(--admin-text-muted))] border-[hsl(var(--admin-border))]')}>
            {o.l}
          </button>
        ))}
      </div>
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--admin-text-muted))]" />
      ) : shown.length === 0 ? (
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">Rien dans cette liste.</p>
      ) : (
        <ul className="divide-y divide-[hsl(var(--admin-border))]">
          {shown.map(r => (
            <li key={r.id} className="flex items-center gap-3 py-2 min-h-[48px]">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[hsl(var(--admin-text))] truncate">{r.brand_name ? `${r.brand_name} ` : ''}{r.model_name}</p>
                {r.notes && <p className="text-xs text-[hsl(var(--admin-text-muted))] truncate">{r.notes}</p>}
              </div>
              <button
                onClick={() => setStatus.mutate({ id: r.id, status: NEXT[r.status] })}
                title="Changer le statut"
                className={cn('shrink-0 min-h-[36px] px-3 rounded-full text-xs font-bold', STATUS[r.status].cls)}
              >
                {STATUS[r.status].label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AbsentsPanel;
