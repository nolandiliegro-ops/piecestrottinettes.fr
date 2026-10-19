import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check, X, ChevronLeft, ChevronRight, Search, ImageOff, Loader2,
  Disc, Plug, CircleDot, Gauge, LayoutList, Filter,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────────
   STUDIO COMPAT — valider les compatibilités trottinette par
   trottinette, en visuel. Règles (mémoire moteur-compatibilite) :
   Claude trouve et explique, Nolan tranche ; Georges en dernier
   recours. Valider = confidence_level 'validated' ; rejeter =
   suppression du lien (même mécanique que la vue classique).
   ──────────────────────────────────────────────────────────────── */

type Confidence = 'validated' | 'high' | 'medium' | 'low';

interface StudioScooter {
  id: string; name: string; slug: string; image_url: string | null;
  published: boolean; year: number | null; voltage: number | null;
  power_watts: number | null; tire_size: string | null;
  brake_type: string | null; caliper_family: string | null;
  charge_connectors: string[] | null;
  brand: { name: string } | null;
}

interface CompatRow {
  part_id: string;
  auto_suggested: boolean;
  confidence_level: string;
  suggestion_reason: string | null;
  position: string | null;
  part: {
    id: string; name: string; slug: string; image_url: string | null;
    price: number | null; published: boolean;
    category: { name: string } | null;
  } | null;
}

const BRAKE_FR: Record<string, string> = {
  disc: 'Disque', drum: 'Tambour', eabs: 'E-ABS', none: 'Aucun',
  disc_front_drum_rear: 'Disque AV / tambour AR', ebs_front_disc_rear: 'EBS AV / disque AR',
  drum_front_disc_rear: 'Tambour AV / disque AR', disc_front_disc_rear: 'Disque AV + AR',
};

const CONF: Record<Confidence, { label: string; cls: string; dot: string }> = {
  validated: { label: 'Validée', cls: 'bg-[hsl(var(--admin-accent)/0.12)] text-[hsl(var(--admin-accent))]', dot: 'bg-[hsl(var(--admin-accent))]' },
  high: { label: 'Haute', cls: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  medium: { label: 'Moyenne', cls: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  low: { label: 'Basse', cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

const confOf = (r: CompatRow): Confidence =>
  !r.auto_suggested ? 'validated'
    : (['high', 'medium', 'low'] as const).includes(r.confidence_level as 'high') ? (r.confidence_level as Confidence) : 'medium';

/* ── Données ── */

const useStudioScooters = () => useQuery({
  queryKey: ['studio-scooters'],
  staleTime: 120_000,
  queryFn: async (): Promise<StudioScooter[]> => {
    const { data, error } = await supabase
      .from('scooter_models')
      .select('id, name, slug, image_url, published, year, voltage, power_watts, tire_size, brake_type, caliper_family, charge_connectors, brand:brands!scooter_models_brand_id_fkey(name)')
      .order('name');
    if (error) throw error;
    return (data || []) as unknown as StudioScooter[];
  },
});

const useScooterCompat = (scooterId: string | null) => useQuery({
  queryKey: ['studio-compat', scooterId],
  enabled: !!scooterId,
  queryFn: async (): Promise<CompatRow[]> => {
    const { data, error } = await supabase
      .from('part_compatibility')
      .select('part_id, auto_suggested, confidence_level, suggestion_reason, position, part:parts(id, name, slug, image_url, price, published, category:categories(name))')
      .eq('scooter_model_id', scooterId as string);
    if (error) throw error;
    return (data || []) as unknown as CompatRow[];
  },
});

/* ── Carte pièce ── */

const PartCompatCard = ({
  row, onValidate, onReject, busy,
}: { row: CompatRow; onValidate: () => void; onReject: () => void; busy: boolean }) => {
  const part = row.part;
  if (!part) return null;
  const conf = confOf(row);
  const c = CONF[conf];
  return (
    <div className="admin-glass-card rounded-2xl overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-white flex items-center justify-center">
        {part.image_url ? (
          <img src={part.image_url} alt={part.name} loading="lazy" className="w-full h-full object-contain p-3" />
        ) : (
          <ImageOff className="w-8 h-8 text-[hsl(var(--admin-text-muted))]" />
        )}
        <span className={cn('absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full', c.cls)}>{c.label}</span>
        {row.position && row.position !== 'les_deux' && (
          <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--al15))] text-[hsl(var(--admin-text-muted))] uppercase">
            {row.position === 'avant' ? 'AVANT' : 'ARRIÈRE'}
          </span>
        )}
        {!part.published && (
          <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--al20))] text-[hsl(var(--admin-text-muted))]">
            Pièce dépubliée
          </span>
        )}
      </div>
      <div className="flex-1 flex flex-col px-3 pt-2 pb-3 gap-1 border-t border-[hsl(var(--admin-border))]">
        <p className="text-[13px] font-semibold leading-snug line-clamp-2 text-[hsl(var(--admin-text))]">{part.name}</p>
        {row.suggestion_reason && (
          <p className="text-[11px] text-[hsl(var(--admin-text-muted))] line-clamp-2" title={row.suggestion_reason}>
            {row.suggestion_reason}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-1.5 gap-2">
          <span className="text-sm font-black text-[hsl(var(--admin-text))]">{part.price != null ? `${part.price} €` : ''}</span>
          <div className="flex items-center gap-1.5">
            {busy ? <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--admin-text-muted))]" /> : (
              <>
                <button
                  onClick={onReject}
                  title="Pas compatible — retirer"
                  className="w-10 h-10 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={onValidate}
                  disabled={conf === 'validated'}
                  title={conf === 'validated' ? 'Déjà validée' : 'Compatible — valider'}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    conf === 'validated'
                      ? 'bg-[hsl(var(--admin-accent)/0.15)] text-[hsl(var(--admin-accent))] cursor-default'
                      : 'bg-[hsl(var(--admin-accent))] text-white hover:opacity-90'
                  )}
                >
                  <Check className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Studio ── */

const CompatStudio = ({ onClassic }: { onClassic: () => void }) => {
  const qc = useQueryClient();
  const { data: scooters = [], isLoading: loadingScooters } = useStudioScooters();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confFilter, setConfFilter] = useState<'all' | 'to_validate' | Confidence>('to_validate');
  const [busyPart, setBusyPart] = useState<string | null>(null);

  const scooter = scooters.find(s => s.id === selectedId) ?? null;
  const { data: rows = [], isLoading: loadingCompat } = useScooterCompat(selectedId);

  const filteredScooters = useMemo(() => {
    const q = search.toLowerCase();
    return scooters.filter(s => s.name.toLowerCase().includes(q) || (s.brand?.name ?? '').toLowerCase().includes(q));
  }, [scooters, search]);

  const idx = scooter ? filteredScooters.findIndex(s => s.id === scooter.id) : -1;
  const goto = (delta: number) => {
    if (!filteredScooters.length) return;
    const next = idx < 0 ? 0 : (idx + delta + filteredScooters.length) % filteredScooters.length;
    setSelectedId(filteredScooters[next].id);
  };

  const counts = useMemo(() => {
    const c = { all: rows.length, to_validate: 0, validated: 0, high: 0, medium: 0, low: 0 };
    rows.forEach(r => { const k = confOf(r); c[k]++; if (k !== 'validated') c.to_validate++; });
    return c;
  }, [rows]);

  const visibleRows = useMemo(() => {
    const keep = rows.filter(r => {
      const k = confOf(r);
      if (confFilter === 'all') return true;
      if (confFilter === 'to_validate') return k !== 'validated';
      return k === confFilter;
    });
    // groupé par catégorie, triées par nom
    const groups = new Map<string, CompatRow[]>();
    keep.forEach(r => {
      const cat = r.part?.category?.name ?? 'Autres';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(r);
    });
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  }, [rows, confFilter]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['studio-compat', selectedId] });
  };

  const validateOne = useMutation({
    mutationFn: async (partId: string) => {
      const { error } = await supabase
        .from('part_compatibility')
        .update({ auto_suggested: false, confidence_level: 'validated' })
        .eq('part_id', partId).eq('scooter_model_id', selectedId as string);
      if (error) throw error;
    },
    onMutate: (partId) => setBusyPart(partId),
    onSettled: () => { setBusyPart(null); invalidate(); },
    onSuccess: () => toast.success('Compatibilité validée'),
    onError: (e: Error) => toast.error(`Échec : ${e.message}`),
  });

  const rejectOne = useMutation({
    mutationFn: async (partId: string) => {
      const { error } = await supabase
        .from('part_compatibility')
        .delete()
        .eq('part_id', partId).eq('scooter_model_id', selectedId as string);
      if (error) throw error;
    },
    onMutate: (partId) => setBusyPart(partId),
    onSettled: () => { setBusyPart(null); invalidate(); },
    onSuccess: () => toast.success('Lien retiré — un futur retrigger peut le reproposer'),
    onError: (e: Error) => toast.error(`Échec : ${e.message}`),
  });

  const validateVisible = useMutation({
    mutationFn: async () => {
      const ids = visibleRows.flatMap(([, rs]) => rs.filter(r => confOf(r) !== 'validated').map(r => r.part_id));
      if (!ids.length) return 0;
      const { error } = await supabase
        .from('part_compatibility')
        .update({ auto_suggested: false, confidence_level: 'validated' })
        .eq('scooter_model_id', selectedId as string)
        .in('part_id', ids);
      if (error) throw error;
      return ids.length;
    },
    onSettled: invalidate,
    onSuccess: (n) => toast.success(`${n} compatibilité(s) validée(s)`),
    onError: (e: Error) => toast.error(`Échec : ${e.message}`),
  });

  /* ── Rendu ── */

  return (
    <div className="flex flex-col lg:flex-row gap-3">
      {/* Rail trottinettes */}
      <aside className="lg:w-72 shrink-0 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--admin-text-muted))]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Trottinette, marque…"
            className="pl-9 bg-white border-[hsl(var(--admin-border))]"
          />
        </div>
        <div className="admin-glass-card rounded-2xl overflow-hidden max-h-[280px] lg:max-h-[calc(100vh-240px)] overflow-y-auto">
          {loadingScooters ? (
            <div className="p-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[hsl(var(--admin-text-muted))]" /></div>
          ) : filteredScooters.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 min-h-[52px] text-left border-b border-[hsl(var(--admin-border))] last:border-0 transition-colors',
                s.id === selectedId ? 'bg-[hsl(var(--admin-accent)/0.1)]' : 'hover:bg-[hsl(var(--aov03))]'
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-[hsl(var(--admin-border))] flex items-center justify-center overflow-hidden shrink-0">
                {s.image_url
                  ? <img src={s.image_url} alt="" loading="lazy" className="w-full h-full object-contain p-0.5" />
                  : <ImageOff className="w-4 h-4 text-[hsl(var(--admin-text-muted))]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold truncate text-[hsl(var(--admin-text))]">{s.name}</p>
                <p className="text-[11px] text-[hsl(var(--admin-text-muted))] truncate">
                  {s.brand?.name ?? '—'}{!s.published && ' · brouillon'}
                </p>
              </div>
              {s.id === selectedId && <ChevronRight className="w-4 h-4 text-[hsl(var(--admin-accent))] shrink-0" />}
            </button>
          ))}
        </div>
      </aside>

      {/* Scène */}
      <section className="flex-1 min-w-0 space-y-3">
        {!scooter ? (
          <div className="admin-glass-card rounded-2xl p-10 text-center text-[hsl(var(--admin-text-muted))]">
            <CircleDot className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-[hsl(var(--admin-text))]">Choisis une trottinette</p>
            <p className="text-sm mt-1">Sa photo, ses clés de montage et toutes ses pièces s'affichent ici — tu valides ✓ ou tu retires ✗, puis trottinette suivante.</p>
          </div>
        ) : (
          <>
            {/* Bandeau trottinette */}
            <div className="admin-glass-card rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-44 md:w-52 aspect-square bg-white rounded-xl border border-[hsl(var(--admin-border))] flex items-center justify-center shrink-0 overflow-hidden">
                {scooter.image_url
                  ? <img src={scooter.image_url} alt={scooter.name} className="w-full h-full object-contain p-2" />
                  : <ImageOff className="w-10 h-10 text-[hsl(var(--admin-text-muted))]" />}
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--admin-text-muted))]">{scooter.brand?.name ?? '—'}</p>
                    <h2 className="font-display text-2xl md:text-3xl tracking-wide text-[hsl(var(--admin-text))]">{scooter.name.toUpperCase()}</h2>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-[hsl(var(--admin-border))]" onClick={() => goto(-1)} aria-label="Trottinette précédente">
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-[hsl(var(--admin-border))]" onClick={() => goto(1)} aria-label="Trottinette suivante">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                {/* Clés de montage */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {scooter.tire_size && <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-[hsl(var(--al15))] text-[hsl(var(--admin-text))]"><CircleDot className="w-3.5 h-3.5" />{scooter.tire_size}</span>}
                  {scooter.brake_type && <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-[hsl(var(--al15))] text-[hsl(var(--admin-text))]"><Disc className="w-3.5 h-3.5" />{BRAKE_FR[scooter.brake_type] ?? scooter.brake_type}</span>}
                  {scooter.caliper_family && <span className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-[hsl(var(--al15))] text-[hsl(var(--admin-text))]">Étrier {scooter.caliper_family}</span>}
                  {(scooter.charge_connectors ?? []).map(c => <span key={c} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-[hsl(var(--al15))] text-[hsl(var(--admin-text))]"><Plug className="w-3.5 h-3.5" />{c}</span>)}
                  {scooter.voltage && <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-[hsl(var(--al15))] text-[hsl(var(--admin-text))]"><Gauge className="w-3.5 h-3.5" />{scooter.voltage} V</span>}
                </div>
                {/* Progression */}
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between text-xs text-[hsl(var(--admin-text-muted))] mb-1">
                    <span>{counts.validated}/{counts.all} validées sur ce modèle</span>
                    <span>{idx + 1}/{filteredScooters.length} trottinettes</span>
                  </div>
                  <div className="h-2 rounded-full bg-[hsl(var(--al15))] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[hsl(var(--admin-accent))] transition-all"
                      style={{ width: counts.all ? `${(counts.validated / counts.all) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Filtres + actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-[hsl(var(--admin-text-muted))]" />
              {([
                { id: 'to_validate', label: `À valider (${counts.to_validate})` },
                { id: 'all', label: `Tout (${counts.all})` },
                { id: 'high', label: `Haute (${counts.high})` },
                { id: 'medium', label: `Moyenne (${counts.medium})` },
                { id: 'low', label: `Basse (${counts.low})` },
                { id: 'validated', label: `Validées (${counts.validated})` },
              ] as const).map(f => (
                <button
                  key={f.id}
                  onClick={() => setConfFilter(f.id)}
                  className={cn(
                    'px-3 py-2 min-h-[40px] rounded-full text-sm font-medium whitespace-nowrap border transition-colors',
                    confFilter === f.id
                      ? 'bg-[hsl(var(--admin-accent))] text-white border-transparent'
                      : 'bg-white text-[hsl(var(--admin-text-muted))] border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--aov03))]'
                  )}
                >
                  {f.label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                {confFilter !== 'validated' && counts.to_validate > 0 && (
                  <Button
                    onClick={() => validateVisible.mutate()}
                    disabled={validateVisible.isPending}
                    className="bg-[hsl(var(--admin-accent))] hover:opacity-90 text-white gap-2 min-h-[40px]"
                  >
                    {validateVisible.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Tout valider l'affichage
                  </Button>
                )}
                <Button variant="outline" onClick={onClassic} className="gap-2 bg-white border-[hsl(var(--admin-border))] min-h-[40px]">
                  <LayoutList className="w-4 h-4" /> Vue classique
                </Button>
              </div>
            </div>

            {/* Cartes par catégorie */}
            {loadingCompat ? (
              <div className="admin-glass-card rounded-2xl p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--admin-text-muted))]" /></div>
            ) : visibleRows.length === 0 ? (
              <div className="admin-glass-card rounded-2xl p-8 text-center text-sm text-[hsl(var(--admin-text-muted))]">
                {counts.all === 0
                  ? 'Aucune pièce reliée à ce modèle — le moteur n\'a rien proposé (clés manquantes ?).'
                  : 'Rien dans ce filtre. Passe sur « Tout » ou trottinette suivante →'}
              </div>
            ) : (
              visibleRows.map(([cat, catRows]) => (
                <div key={cat}>
                  <div className="flex items-baseline justify-between px-1 pb-2">
                    <h3 className="text-sm font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">{cat}</h3>
                    <span className="text-xs text-[hsl(var(--admin-text-muted))]">{catRows.length} pièce{catRows.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {catRows.map(r => (
                      <PartCompatCard
                        key={r.part_id}
                        row={r}
                        busy={busyPart === r.part_id}
                        onValidate={() => validateOne.mutate(r.part_id)}
                        onReject={() => rejectOne.mutate(r.part_id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default CompatStudio;
