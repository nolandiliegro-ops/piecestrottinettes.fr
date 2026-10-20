import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check, X, ChevronLeft, ChevronRight, Search, ImageOff, Loader2,
  Disc, Plug, CircleDot, Gauge, LayoutList, Filter, Plus, ArrowDownWideNarrow, Pencil,
} from 'lucide-react';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  // Clés de MATCHING roue + disque (les champs que le moteur lit — tire_size n'est que de l'affichage)
  rim_diameter_code: string | null; tire_section_code: string | null;
  tire_family: string | null;
  disc_diameter_code: string | null; disc_pcd_code: string | null; disc_holes_code: string | null;
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
    part_suppliers: { supplier_name: string }[] | null;
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

/* ── Pastilles de clés cliquables + éditeur (19/10) ──
   Chaque clé de montage s'édite SUR PLACE — y compris caliper_family et
   charge_connectors qui n'avaient aucun éditeur admin avant (SQL only).
   NB : modifier une clé ne relance pas le moteur ; les nouvelles valeurs
   serviront au prochain retrigger. */

const KeyPill = ({ icon, children, empty, onClick, label }: {
  icon?: React.ReactNode; children?: React.ReactNode; empty?: boolean; onClick: () => void; label: string;
}) => (
  <button
    onClick={onClick}
    title={`Modifier : ${label}`}
    className={cn(
      'group flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 min-h-[36px] rounded-full transition-all',
      empty
        ? 'border border-dashed border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text-muted))] hover:border-[hsl(var(--admin-accent))] hover:text-[hsl(var(--admin-accent))]'
        : 'bg-[hsl(var(--al15))] text-[hsl(var(--admin-text))] hover:ring-2 hover:ring-[hsl(var(--admin-accent)/0.4)]'
    )}
  >
    {icon}
    {children}
    {!empty && <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />}
  </button>
);

const KeysEditDialog = ({ scooter, allScooters, open, onOpenChange }: {
  scooter: StudioScooter; allScooters: StudioScooter[]; open: boolean; onOpenChange: (o: boolean) => void;
}) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    tire_size: '', brake_type: '', caliper_family: '', connectors: '', voltage: '',
    rim_diameter: '', tire_section: '', tire_family: '', disc_d: '', disc_pcd: '', disc_holes: '',
  });

  useEffect(() => {
    if (open) setForm({
      tire_size: scooter.tire_size ?? '',
      brake_type: scooter.brake_type ?? '',
      caliper_family: scooter.caliper_family ?? '',
      connectors: (scooter.charge_connectors ?? []).join(', '),
      voltage: scooter.voltage != null ? String(scooter.voltage) : '',
      rim_diameter: scooter.rim_diameter_code ?? '',
      tire_section: scooter.tire_section_code ?? '',
      tire_family: scooter.tire_family ?? '',
      disc_d: scooter.disc_diameter_code ?? '',
      disc_pcd: scooter.disc_pcd_code ?? '',
      disc_holes: scooter.disc_holes_code ?? '',
    });
  }, [open, scooter]);

  // Valeurs déjà en base sur d'autres modèles → listes canoniques (on choisit, on n'invente pas).
  const distinct = (pick: (s: StudioScooter) => string | null | undefined) =>
    [...new Set(allScooters.map(pick).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
  const knownCalipers = useMemo(() => distinct(s => s.caliper_family), [allScooters]);
  const knownConnectors = useMemo(() => [...new Set(allScooters.flatMap(s => s.charge_connectors ?? []))].sort(), [allScooters]);
  const knownRims = useMemo(() => distinct(s => s.rim_diameter_code), [allScooters]);
  const knownSections = useMemo(() => distinct(s => s.tire_section_code), [allScooters]);
  const knownDiscD = useMemo(() => distinct(s => s.disc_diameter_code), [allScooters]);
  const knownPcd = useMemo(() => distinct(s => s.disc_pcd_code), [allScooters]);
  const knownHoles = useMemo(() => distinct(s => s.disc_holes_code), [allScooters]);

  const save = useMutation({
    mutationFn: async () => {
      const volt = form.voltage.trim() === '' ? null : Number(form.voltage.replace(',', '.'));
      if (volt !== null && !Number.isFinite(volt)) throw new Error('Voltage invalide');
      const connectors = form.connectors.split(',').map(s => s.trim()).filter(Boolean);
      // Règle gravée : mieux VIDE que faux — un champ laissé vide écrit NULL, jamais une valeur devinée.
      const patch = {
        tire_size: form.tire_size.trim() || null,
        brake_type: form.brake_type || null,
        caliper_family: form.caliper_family.trim() || null,
        charge_connectors: connectors.length ? connectors : null,
        voltage: volt,
        rim_diameter_code: form.rim_diameter.trim() || null,
        tire_section_code: form.tire_section.trim() || null,
        tire_family: form.tire_family || null,
        disc_diameter_code: form.disc_d.trim() || null,
        disc_pcd_code: form.disc_pcd.trim() || null,
        disc_holes_code: form.disc_holes.trim() || null,
      } satisfies TablesUpdate<'scooter_models'>;
      const { error } = await supabase.from('scooter_models').update(patch).eq('id', scooter.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Clés de montage mises à jour', { description: 'Elles seront prises en compte au prochain passage du moteur.' });
      qc.invalidateQueries({ queryKey: ['studio-scooters'] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Erreur de mise à jour'),
  });

  const field = 'w-full h-10 px-3 rounded-lg bg-white border border-[hsl(var(--admin-border))] text-sm text-[hsl(var(--admin-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--admin-accent))]';
  const lbl = 'text-[10px] font-black uppercase tracking-wider text-[hsl(var(--admin-text-muted))]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-studio max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide text-[hsl(var(--admin-text))]">CLÉS DE MONTAGE — {scooter.name.toUpperCase()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs rounded-lg bg-[hsl(var(--admin-accent)/0.08)] text-[hsl(var(--admin-text))] px-3 py-2">
            <strong>Clés de matching</strong> — le moteur lit CES champs. Choisis une valeur proposée ; en cas de doute, laisse <strong>vide</strong> (mieux vide que faux).
          </p>

          {/* ROUE — la clé = Ø de jante + section. Les pouces sont un arrondi commercial, pas une mesure. */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className={lbl}>Ø de jante (pouces) — LE discriminant</p>
              <input className={field} list="pt-rims" value={form.rim_diameter} onChange={e => setForm(f => ({ ...f, rim_diameter: e.target.value }))} placeholder="6 / 6.5 / 8.5…" />
              <datalist id="pt-rims">{knownRims.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="space-y-1">
              <p className={lbl}>Section de pneu</p>
              <input className={field} list="pt-sections" value={form.tire_section} onChange={e => setForm(f => ({ ...f, tire_section: e.target.value }))} placeholder="80/65 / 60/70…" />
              <datalist id="pt-sections">{knownSections.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className={lbl}>Famille de pneu</p>
              <select className={field} value={form.tire_family} onChange={e => setForm(f => ({ ...f, tire_family: e.target.value }))}>
                <option value="">— non renseigné —</option>
                <option value="pneumatic">Gonflable</option>
                <option value="solid">Plein</option>
              </select>
            </div>
            <div className="space-y-1">
              <p className={lbl}>Voltage (V)</p>
              <input className={field} inputMode="decimal" value={form.voltage} onChange={e => setForm(f => ({ ...f, voltage: e.target.value }))} placeholder="52" />
            </div>
          </div>

          {/* FREIN — type + géométrie de disque + étrier */}
          <div className="space-y-1">
            <p className={lbl}>Freinage</p>
            <select className={field} value={form.brake_type} onChange={e => setForm(f => ({ ...f, brake_type: e.target.value }))}>
              <option value="">— non renseigné —</option>
              {Object.entries(BRAKE_FR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <p className={lbl}>Ø disque (mm)</p>
              <input className={field} list="pt-discd" value={form.disc_d} onChange={e => setForm(f => ({ ...f, disc_d: e.target.value }))} placeholder="160" />
              <datalist id="pt-discd">{knownDiscD.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="space-y-1">
              <p className={lbl}>Entraxe (mm)</p>
              <input className={field} list="pt-pcd" value={form.disc_pcd} onChange={e => setForm(f => ({ ...f, disc_pcd: e.target.value }))} placeholder="48" />
              <datalist id="pt-pcd">{knownPcd.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="space-y-1">
              <p className={lbl}>Trous</p>
              <input className={field} list="pt-holes" value={form.disc_holes} onChange={e => setForm(f => ({ ...f, disc_holes: e.target.value }))} placeholder="6" />
              <datalist id="pt-holes">{knownHoles.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
          <div className="space-y-1">
            <p className={lbl}>Famille d'étrier</p>
            <input className={field} list="pt-calipers" value={form.caliper_family} onChange={e => setForm(f => ({ ...f, caliper_family: e.target.value }))} placeholder="Zoom / NUTT / Xtech…" />
            <datalist id="pt-calipers">{knownCalipers.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="space-y-1">
            <p className={lbl}>Prises de charge (séparées par des virgules)</p>
            <input className={field} list="pt-connectors" value={form.connectors} onChange={e => setForm(f => ({ ...f, connectors: e.target.value }))} placeholder="GX16-3P, DC 5.5x2.1" />
            <datalist id="pt-connectors">{knownConnectors.map(c => <option key={c} value={c} />)}</datalist>
            <p className="text-[11px] text-[hsl(var(--admin-text-muted))]">Valeurs connues : {knownConnectors.slice(0, 6).join(' · ') || '—'}</p>
          </div>

          {/* AFFICHAGE — ne matche jamais */}
          <div className="space-y-1 border-t border-[hsl(var(--admin-border))] pt-3">
            <p className={lbl}>Taille de pneu — AFFICHAGE CLIENT (le moteur ne lit pas ce champ)</p>
            <input className={field} value={form.tire_size} onChange={e => setForm(f => ({ ...f, tire_size: e.target.value }))} placeholder="10 pouces (10x2.50)" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" className="bg-white border-[hsl(var(--admin-border))]" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button className="bg-green-700 hover:bg-green-800 text-white gap-1.5" disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Clés manquantes (20/10, Nolan : « voir par marque ce qui manque, remplir au magasin ») ──
   Clés comptées : tension, jante, section, prise, frein ; disque et étrier seulement si frein à
   disque ou frein inconnu (un tambour n'a ni disque ni étrier). Colonnes de MATCHING uniquement. */
const KEY_LABEL: Record<string, string> = { v: 'tension', rim: 'jante', sec: 'section', cc: 'prise', brake: 'frein', dd: 'disque', cal: 'étrier' };
const missingKeys = (s: StudioScooter): string[] => {
  const disc = !s.brake_type || s.brake_type.includes('disc');
  const m: string[] = [];
  if (s.voltage == null) m.push('v');
  if (!s.rim_diameter_code) m.push('rim');
  if (!s.tire_section_code) m.push('sec');
  if (!s.charge_connectors?.length) m.push('cc');
  if (!s.brake_type) m.push('brake');
  if (disc && !s.disc_diameter_code) m.push('dd');
  if (disc && !s.caliper_family) m.push('cal');
  return m;
};
const keyCount = (s: StudioScooter) => (!s.brake_type || s.brake_type.includes('disc') ? 7 : 5);

/* ── Données ── */

const useStudioScooters = () => useQuery({
  queryKey: ['studio-scooters'],
  staleTime: 120_000,
  queryFn: async (): Promise<StudioScooter[]> => {
    const { data, error } = await supabase
      .from('scooter_models')
      .select('id, name, slug, image_url, published, year, voltage, power_watts, tire_size, brake_type, caliper_family, charge_connectors, rim_diameter_code, tire_section_code, tire_family, disc_diameter_code, disc_pcd_code, disc_holes_code, brand:brands!scooter_models_brand_id_fkey(name)')
      .order('name');
    if (error) throw error;
    return (data || []) as unknown as StudioScooter[];
  },
});

interface CompatCount { scooter_model_id: string; total: number; to_validate: number }

/** Compteurs par trottinette — RPC créée le 19/10 (garde admin), 1 requête pour tout le rail. */
const useCompatCounts = () => useQuery({
  queryKey: ['studio-compat-counts'],
  staleTime: 60_000,
  queryFn: async (): Promise<Map<string, CompatCount>> => {
    const { data, error } = await (supabase.rpc as CallableFunction)('admin_compat_counts');
    if (error) throw error;
    const map = new Map<string, CompatCount>();
    (data as CompatCount[] | null)?.forEach(r => map.set(r.scooter_model_id, { ...r, total: Number(r.total), to_validate: Number(r.to_validate) }));
    return map;
  },
});

const useScooterCompat = (scooterId: string | null) => useQuery({
  queryKey: ['studio-compat', scooterId],
  enabled: !!scooterId,
  queryFn: async (): Promise<CompatRow[]> => {
    const { data, error } = await supabase
      .from('part_compatibility')
      .select('part_id, auto_suggested, confidence_level, suggestion_reason, position, part:parts(id, name, slug, image_url, price, published, category:categories(name), part_suppliers(supplier_name))')
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
      <div className="relative h-28 bg-white flex items-center justify-center">
        {part.image_url ? (
          <img src={part.image_url} alt={part.name} loading="lazy" className="w-full h-full object-contain p-2" />
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
      <div className="flex-1 flex flex-col px-2.5 pt-1.5 pb-2 gap-0.5 border-t border-[hsl(var(--admin-border))]">
        <p className="text-[12px] font-semibold leading-snug line-clamp-2 min-h-[32px] text-[hsl(var(--admin-text))]">{part.name}</p>
        <p className="text-[10px] text-[hsl(var(--admin-text-muted))] truncate" title={row.suggestion_reason ?? undefined}>
          {row.suggestion_reason ?? '\u00a0'}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--admin-accent))] truncate">
          {(part.part_suppliers ?? []).map(ps => ps.supplier_name).join(' · ') || '\u00a0'}
        </p>
        <div className="mt-auto flex items-center justify-between pt-1 gap-2">
          <span className="text-[13px] font-black text-[hsl(var(--admin-text))]">{part.price != null ? `${part.price} €` : ''}</span>
          <div className="flex items-center gap-1">
            {busy ? <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--admin-text-muted))]" /> : (
              <>
                <button
                  onClick={onReject}
                  title="Pas compatible — retirer"
                  className="w-9 h-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={onValidate}
                  disabled={conf === 'validated'}
                  title={conf === 'validated' ? 'Déjà validée' : 'Compatible — valider'}
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center',
                    conf === 'validated'
                      ? 'bg-[hsl(var(--admin-accent)/0.15)] text-[hsl(var(--admin-accent))] cursor-default'
                      : 'bg-[hsl(var(--admin-accent))] text-white hover:opacity-90'
                  )}
                >
                  <Check className="w-4 h-4" />
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
  const [railSort, setRailSort] = useState<'az' | 'to_validate' | 'missing'>('az');
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [brandSort, setBrandSort] = useState<'missing' | 'az'>('missing');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [keysOpen, setKeysOpen] = useState(false);
  const { data: counts_by_scooter } = useCompatCounts();

  const scooter = scooters.find(s => s.id === selectedId) ?? null;
  const { data: rows = [], isLoading: loadingCompat } = useScooterCompat(selectedId);

  const filteredScooters = useMemo(() => {
    const q = search.toLowerCase();
    const list = scooters.filter(s => (!brandFilter || s.brand?.name === brandFilter) && (s.name.toLowerCase().includes(q) || (s.brand?.name ?? '').toLowerCase().includes(q)));
    if (railSort === 'missing') {
      const tot = (id: string) => counts_by_scooter?.get(id)?.total ?? 0;
      return [...list].sort((a, b) => missingKeys(b).length - missingKeys(a).length || tot(a.id) - tot(b.id) || a.name.localeCompare(b.name, 'fr'));
    }
    if (railSort === 'to_validate') {
      const tv = (id: string) => counts_by_scooter?.get(id)?.to_validate ?? 0;
      const tot = (id: string) => counts_by_scooter?.get(id)?.total ?? 0;
      return [...list].sort((a, b) => tv(b.id) - tv(a.id) || tot(a.id) - tot(b.id) || a.name.localeCompare(b.name, 'fr'));
    }
    return list;
  }, [scooters, search, railSort, counts_by_scooter, brandFilter]);

  /* Vue par marque : trottinettes PUBLIÉES uniquement (le site), taux de remplissage des clés. */
  const brandStats = useMemo(() => {
    const by = new Map<string, StudioScooter[]>();
    scooters.filter(s => s.published).forEach(s => { const b = s.brand?.name ?? '—'; by.set(b, [...(by.get(b) ?? []), s]); });
    const list = [...by.entries()].map(([brand, ss]) => {
      const tot = ss.reduce((n, s) => n + keyCount(s), 0);
      const miss = ss.reduce((n, s) => n + missingKeys(s).length, 0);
      return {
        brand, n: ss.length,
        todo: ss.filter(s => missingKeys(s).length > 0).length,
        zero: ss.filter(s => (counts_by_scooter?.get(s.id)?.total ?? 0) === 0).length,
        pct: tot ? Math.round(100 * (1 - miss / tot)) : 100,
      };
    });
    return list.sort(brandSort === 'az' ? (a, b) => a.brand.localeCompare(b.brand, 'fr') : (a, b) => b.todo - a.todo || a.pct - b.pct || a.brand.localeCompare(b.brand, 'fr'));
  }, [scooters, counts_by_scooter, brandSort]);
  const parcStats = useMemo(() => {
    const pub = scooters.filter(s => s.published);
    const by: Record<string, number> = {};
    pub.forEach(s => missingKeys(s).forEach(k => { by[k] = (by[k] ?? 0) + 1; }));
    return { n: pub.length, complete: pub.filter(s => missingKeys(s).length === 0).length, by };
  }, [scooters]);
  const openBrand = (b: string) => { setBrandFilter(b); setRailSort('missing'); setSelectedId(null); setSearch(''); };

  const idx = scooter ? filteredScooters.findIndex(s => s.id === scooter.id) : -1;
  const goto = (delta: number) => {
    if (!filteredScooters.length) return;
    const next = idx < 0 ? 0 : (idx + delta + filteredScooters.length) % filteredScooters.length;
    setSelectedId(filteredScooters[next].id);
    setCatFilter('all');
  };

  const counts = useMemo(() => {
    const c = { all: rows.length, to_validate: 0, validated: 0, high: 0, medium: 0, low: 0 };
    rows.forEach(r => { const k = confOf(r); c[k]++; if (k !== 'validated') c.to_validate++; });
    return c;
  }, [rows]);

  const confKept = useMemo(() => rows.filter(r => {
    const k = confOf(r);
    if (confFilter === 'all') return true;
    if (confFilter === 'to_validate') return k !== 'validated';
    return k === confFilter;
  }), [rows, confFilter]);

  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    confKept.forEach(r => {
      const cat = r.part?.category?.name ?? 'Autres';
      m.set(cat, (m.get(cat) ?? 0) + 1);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  }, [confKept]);

  const visibleRows = useMemo(() => {
    const keep = confKept.filter(r => catFilter === 'all' || (r.part?.category?.name ?? 'Autres') === catFilter);
    // groupé par catégorie, triées par nom
    const groups = new Map<string, CompatRow[]>();
    keep.forEach(r => {
      const cat = r.part?.category?.name ?? 'Autres';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(r);
    });
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  }, [confKept, catFilter]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['studio-compat', selectedId] });
    qc.invalidateQueries({ queryKey: ['studio-compat-counts'] });
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

  const { data: addResults = [], isFetching: addSearching } = useQuery({
    queryKey: ['studio-add-search', addSearch],
    enabled: addOpen && addSearch.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parts')
        .select('id, name, image_url, price, published, sku, category:categories(name)')
        .or(`name.ilike.%${addSearch.trim()}%,sku.ilike.%${addSearch.trim()}%`)
        .order('name')
        .limit(24);
      if (error) throw error;
      return data || [];
    },
  });

  const addPart = useMutation({
    mutationFn: async (partId: string) => {
      const { error } = await supabase
        .from('part_compatibility')
        .insert({ part_id: partId, scooter_model_id: selectedId as string, auto_suggested: false, confidence_level: 'validated' });
      if (error) throw error;
    },
    onSettled: invalidate,
    onSuccess: () => toast.success('Pièce reliée et validée'),
    onError: (e: Error) => toast.error(e.message.includes('duplicate') ? 'Déjà reliée à ce modèle' : `Échec : ${e.message}`),
  });

  /* ── Rendu ── */

  return (
    <div className="flex flex-col lg:flex-row gap-3">
      {/* Rail trottinettes */}
      <aside className="lg:w-72 shrink-0 space-y-2">
        {scooter && (
          <button
            onClick={() => setSelectedId(null)}
            className="w-full min-h-[40px] flex items-center gap-2 px-3 rounded-xl border border-[hsl(var(--admin-border))] bg-white text-sm font-semibold text-[hsl(var(--admin-text))]"
          >
            <LayoutList className="w-4 h-4" /> Vue par marque
          </button>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--admin-text-muted))]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Trottinette, marque…"
            className="pl-9 bg-white border-[hsl(var(--admin-border))]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {([
            { id: 'az', label: 'A → Z' },
            { id: 'to_validate', label: 'À trier d\'abord' },
            { id: 'missing', label: 'Clés manquantes' },
          ] as const).map(o => (
            <button
              key={o.id}
              onClick={() => setRailSort(o.id)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border',
                railSort === o.id
                  ? 'bg-[hsl(var(--admin-accent))] text-white border-transparent'
                  : 'bg-white text-[hsl(var(--admin-text-muted))] border-[hsl(var(--admin-border))]'
              )}
            >
              {o.id === 'to_validate' && <ArrowDownWideNarrow className="w-3 h-3" />}
              {o.label}
            </button>
          ))}
        </div>
        {brandFilter && (
          <button
            onClick={() => setBrandFilter(null)}
            className="w-full min-h-[40px] flex items-center justify-between gap-2 px-3 rounded-xl bg-[hsl(var(--admin-text))] text-white text-sm font-semibold"
            aria-label={`Retirer le filtre marque ${brandFilter}`}
          >
            <span className="truncate">Marque : {brandFilter}</span>
            <X className="w-4 h-4 shrink-0" />
          </button>
        )}
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
                  {(() => { const m = missingKeys(s); return m.length ? <span className="text-orange-700 font-semibold"> · {m.length} clé{m.length > 1 ? 's' : ''} manque{m.length > 1 ? 'nt' : ''}</span> : null; })()}
                </p>
              </div>
              {(() => {
                const c = counts_by_scooter?.get(s.id);
                const total = c?.total ?? 0;
                const tv = c?.to_validate ?? 0;
                return (
                  <span className="flex items-center gap-1 shrink-0">
                    <span className={cn(
                      'min-w-[22px] h-[20px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center',
                      total === 0 ? 'bg-red-100 text-red-700' : 'bg-[hsl(var(--al15))] text-[hsl(var(--admin-text-muted))]'
                    )}>
                      {total}
                    </span>
                    {tv > 0 && (
                      <span className="min-w-[22px] h-[20px] px-1 rounded-full bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center">
                        {tv}
                      </span>
                    )}
                  </span>
                );
              })()}
            </button>
          ))}
        </div>
      </aside>

      {/* Scène */}
      <section className="flex-1 min-w-0 space-y-3">
        {!scooter ? (
          <div className="space-y-3">
            <div className="admin-glass-card rounded-2xl p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">Clés de montage par marque</h3>
                <span className="text-sm text-[hsl(var(--admin-text-muted))] tabular-nums">{parcStats.complete}/{parcStats.n} trottinettes publiées complètes</span>
              </div>
              <p className="text-sm text-[hsl(var(--admin-text-muted))] mt-1">
                Clés vides : {Object.entries(parcStats.by).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${KEY_LABEL[k]} ${n}`).join(' · ') || 'aucune'}.
                Choisis une marque, puis remplis les clés qui manquent avec le bouton « Clés » de chaque trottinette.
              </p>
              <div className="flex items-center gap-1.5 mt-3">
                {([{ id: 'missing', label: 'Le plus à compléter' }, { id: 'az', label: 'A → Z' }] as const).map(o => (
                  <button key={o.id} onClick={() => setBrandSort(o.id)}
                    className={cn('px-3 min-h-[36px] rounded-full text-xs font-semibold border',
                      brandSort === o.id ? 'bg-[hsl(var(--admin-text))] text-white border-transparent' : 'bg-white text-[hsl(var(--admin-text-muted))] border-[hsl(var(--admin-border))]')}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {brandStats.map(b => (
                <button key={b.brand} onClick={() => openBrand(b.brand)}
                  className={cn('admin-glass-card rounded-2xl p-3 min-h-[110px] text-left flex flex-col gap-1.5 border transition-colors hover:border-[hsl(var(--admin-text))]',
                    brandFilter === b.brand ? 'border-[hsl(var(--admin-accent))]' : 'border-transparent')}>
                  <span className="text-[15px] font-black uppercase leading-tight text-[hsl(var(--admin-text))]">{b.brand}</span>
                  <span className="text-xs text-[hsl(var(--admin-text-muted))]">
                    {b.n} trottinette{b.n > 1 ? 's' : ''} · {b.todo ? `${b.todo} à compléter` : 'complète'}
                    {b.zero > 0 && <span className="text-red-700 font-semibold"> · {b.zero} sans pièce</span>}
                  </span>
                  <span className="mt-auto flex items-center gap-2">
                    <span className="flex-1 h-1.5 rounded-full bg-[hsl(var(--al15))] overflow-hidden">
                      <span className="block h-full bg-[hsl(var(--admin-accent))]" style={{ width: `${b.pct}%` }} />
                    </span>
                    <span className="text-xs font-bold tabular-nums text-[hsl(var(--admin-text))]">{b.pct} %</span>
                  </span>
                </button>
              ))}
            </div>
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
                {/* Clés de montage — pastilles CLIQUABLES. La roue affiche la CLÉ (section · Ø jante),
                    jamais la prose tire_size : un champ d'affichage ne matche jamais. */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <KeyPill label="roue (section + Ø jante)" icon={<CircleDot className="w-3.5 h-3.5" />} empty={!scooter.tire_section_code && !scooter.rim_diameter_code} onClick={() => setKeysOpen(true)}>
                    {scooter.tire_section_code || scooter.rim_diameter_code
                      ? `${scooter.tire_section_code ?? '?'} · jante ${scooter.rim_diameter_code ?? '?'}"`
                      : '+ Roue'}
                  </KeyPill>
                  <KeyPill label="freinage" icon={<Disc className="w-3.5 h-3.5" />} empty={!scooter.brake_type} onClick={() => setKeysOpen(true)}>
                    {scooter.brake_type ? (BRAKE_FR[scooter.brake_type] ?? scooter.brake_type) : '+ Frein'}
                  </KeyPill>
                  <KeyPill label="disque (Ø / entraxe / trous)" empty={!scooter.disc_diameter_code} onClick={() => setKeysOpen(true)}>
                    {scooter.disc_diameter_code
                      ? `Disque ${scooter.disc_diameter_code}/${scooter.disc_pcd_code ?? '?'}/${scooter.disc_holes_code ?? '?'}`
                      : '+ Disque'}
                  </KeyPill>
                  <KeyPill label="famille d'étrier" empty={!scooter.caliper_family} onClick={() => setKeysOpen(true)}>
                    {scooter.caliper_family ? `Étrier ${scooter.caliper_family}` : '+ Étrier'}
                  </KeyPill>
                  {(scooter.charge_connectors ?? []).map(c => (
                    <KeyPill key={c} label="prises de charge" icon={<Plug className="w-3.5 h-3.5" />} onClick={() => setKeysOpen(true)}>{c}</KeyPill>
                  ))}
                  {!(scooter.charge_connectors ?? []).length && (
                    <KeyPill label="prises de charge" icon={<Plug className="w-3.5 h-3.5" />} empty onClick={() => setKeysOpen(true)}>+ Prise</KeyPill>
                  )}
                  <KeyPill label="voltage" icon={<Gauge className="w-3.5 h-3.5" />} empty={scooter.voltage == null} onClick={() => setKeysOpen(true)}>
                    {scooter.voltage != null ? `${scooter.voltage} V` : '+ Voltage'}
                  </KeyPill>
                </div>
                <KeysEditDialog scooter={scooter} allScooters={scooters} open={keysOpen} onOpenChange={setKeysOpen} />
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
                <Button variant="outline" onClick={() => { setAddOpen(true); setAddSearch(''); }} className="gap-2 bg-white border-[hsl(var(--admin-border))] min-h-[40px]">
                  <Plus className="w-4 h-4" /> Ajouter une pièce
                </Button>
                <Button variant="outline" onClick={onClassic} className="gap-2 bg-white border-[hsl(var(--admin-border))] min-h-[40px]">
                  <LayoutList className="w-4 h-4" /> Vue classique
                </Button>
              </div>
            </div>

            {/* Filtre par catégorie de produits */}
            {catCounts.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setCatFilter('all')}
                  className={cn(
                    'px-2.5 py-1.5 min-h-[36px] rounded-full text-xs font-semibold border transition-colors',
                    catFilter === 'all'
                      ? 'bg-[hsl(var(--admin-text))] text-white border-transparent'
                      : 'bg-white text-[hsl(var(--admin-text-muted))] border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--aov03))]'
                  )}
                >
                  Toutes catégories ({confKept.length})
                </button>
                {catCounts.map(([cat, n]) => (
                  <button
                    key={cat}
                    onClick={() => setCatFilter(c => (c === cat ? 'all' : cat))}
                    className={cn(
                      'px-2.5 py-1.5 min-h-[36px] rounded-full text-xs font-semibold border transition-colors',
                      catFilter === cat
                        ? 'bg-[hsl(var(--admin-text))] text-white border-transparent'
                        : 'bg-white text-[hsl(var(--admin-text-muted))] border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--aov03))]'
                    )}
                  >
                    {cat} ({n})
                  </button>
                ))}
              </div>
            )}

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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5">
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
            {/* Ajouter une pièce à ce modèle */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogContent className="bg-[hsl(var(--al10))] border-[hsl(var(--admin-border))] max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display tracking-wide text-[hsl(var(--admin-text))]">
                    RELIER UNE PIÈCE — {scooter.name.toUpperCase()}
                  </DialogTitle>
                </DialogHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--admin-text-muted))]" />
                  <Input
                    autoFocus
                    value={addSearch}
                    onChange={e => setAddSearch(e.target.value)}
                    placeholder="Nom ou SKU de la pièce (2 lettres min.)…"
                    className="pl-9 bg-white border-[hsl(var(--admin-border))]"
                  />
                </div>
                <div className="max-h-[50vh] overflow-y-auto space-y-1">
                  {addSearching && <p className="text-sm text-[hsl(var(--admin-text-muted))] text-center py-4"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Recherche…</p>}
                  {!addSearching && addSearch.trim().length >= 2 && addResults.length === 0 && (
                    <p className="text-sm text-[hsl(var(--admin-text-muted))] text-center py-4">Aucune pièce trouvée</p>
                  )}
                  {addResults.map(pt => {
                    const already = rows.some(r => r.part_id === pt.id);
                    return (
                      <div key={pt.id} className="flex items-center gap-3 p-2 rounded-xl bg-white border border-[hsl(var(--admin-border))]">
                        <div className="w-11 h-11 rounded-lg bg-white border border-[hsl(var(--admin-border))] flex items-center justify-center overflow-hidden shrink-0">
                          {pt.image_url ? <img src={pt.image_url} alt="" className="w-full h-full object-contain p-0.5" /> : <ImageOff className="w-4 h-4 text-[hsl(var(--admin-text-muted))]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate text-[hsl(var(--admin-text))]">{pt.name}</p>
                          <p className="text-[11px] text-[hsl(var(--admin-text-muted))] truncate">
                            {(pt.category as { name: string } | null)?.name ?? '—'}{pt.sku ? ` · ${pt.sku}` : ''}{!pt.published && ' · dépubliée'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          disabled={already || addPart.isPending}
                          onClick={() => addPart.mutate(pt.id)}
                          className={cn('min-h-[40px]', already ? 'bg-[hsl(var(--al15))] text-[hsl(var(--admin-text-muted))]' : 'bg-[hsl(var(--admin-accent))] hover:opacity-90 text-white')}
                        >
                          {already ? 'Déjà reliée' : <><Plus className="w-4 h-4 mr-1" />Relier</>}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </section>
    </div>
  );
};

export default CompatStudio;
