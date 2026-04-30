import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Loader2, Plus, Pencil, Trash2, Star, ExternalLink, Truck, Euro, Package, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SUPPLIERS = [
  'wattiz', 'ewheel', 'voltcorp', 'bluewaycorp',
  'dualtronstore', 'weebot', 'autre',
] as const;
type SupplierName = typeof SUPPLIERS[number];

interface PartSupplierRow {
  id: string;
  part_id: string;
  supplier_name: SupplierName;
  supplier_sku: string | null;
  supplier_url: string | null;
  buy_price_ht: number | null;
  stock_supplier: number | null;
  shipping_time_days: number | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PartSuppliersManagerProps {
  partId: string;
  partPrice?: number | null;
}

interface SupplierFormState {
  supplier_name: SupplierName;
  supplier_sku: string;
  supplier_url: string;
  buy_price_ht: string;
  stock_supplier: string;
  shipping_time_days: string;
  notes: string;
}

const emptyForm: SupplierFormState = {
  supplier_name: 'wattiz',
  supplier_sku: '',
  supplier_url: '',
  buy_price_ht: '',
  stock_supplier: '',
  shipping_time_days: '2',
  notes: '',
};

function rowToForm(row: PartSupplierRow): SupplierFormState {
  return {
    supplier_name: row.supplier_name,
    supplier_sku: row.supplier_sku ?? '',
    supplier_url: row.supplier_url ?? '',
    buy_price_ht: row.buy_price_ht?.toString() ?? '',
    stock_supplier: row.stock_supplier?.toString() ?? '',
    shipping_time_days: row.shipping_time_days?.toString() ?? '2',
    notes: row.notes ?? '',
  };
}

function formToPayload(form: SupplierFormState, partId: string) {
  return {
    part_id: partId,
    supplier_name: form.supplier_name,
    supplier_sku: form.supplier_sku.trim() || null,
    supplier_url: form.supplier_url.trim() || null,
    buy_price_ht: form.buy_price_ht ? Number(form.buy_price_ht) : null,
    stock_supplier: form.stock_supplier ? parseInt(form.stock_supplier, 10) : null,
    shipping_time_days: form.shipping_time_days ? parseInt(form.shipping_time_days, 10) : 2,
    notes: form.notes.trim() || null,
  };
}

const SupplierFormDialog = ({
  partId, initial, rowId, open, onOpenChange,
}: {
  partId: string;
  initial?: PartSupplierRow;
  rowId?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<SupplierFormState>(
    initial ? rowToForm(initial) : emptyForm,
  );

  const setField = <K extends keyof SupplierFormState>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v as SupplierFormState[K] }));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = formToPayload(form, partId);

      if (rowId) {
        const { error } = await supabase
          .from('part_suppliers')
          .update(payload)
          .eq('id', rowId);
        if (error) throw error;
      } else {
        const { count, error: countErr } = await supabase
          .from('part_suppliers')
          .select('id', { count: 'exact', head: true })
          .eq('part_id', partId);
        if (countErr) throw countErr;

        const { error } = await supabase.from('part_suppliers').upsert(
          { ...payload, is_primary: (count ?? 0) === 0 },
          { onConflict: 'part_id,supplier_name' },
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['part-suppliers', partId] });
      toast.success(rowId ? 'Fournisseur modifié' : 'Fournisseur ajouté');
      onOpenChange(false);
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : 'Erreur';
      toast.error(`Erreur : ${msg}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[hsl(0_0%_90%)]">
            {rowId ? 'Modifier fournisseur' : 'Ajouter un fournisseur'}
          </DialogTitle>
          <DialogDescription className="text-[hsl(0_0%_50%)] text-xs">
            Informations B2B internes (non publiques).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-[hsl(0_0%_55%)]">Fournisseur *</label>
            <Select
              value={form.supplier_name}
              onValueChange={(v) => setForm((f) => ({ ...f, supplier_name: v as SupplierName }))}
              disabled={!!rowId}
            >
              <SelectTrigger className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] h-11 text-base md:h-9 md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_20%)]">
                {SUPPLIERS.map((s) => (
                  <SelectItem key={s} value={s} className="text-[hsl(0_0%_90%)] capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[hsl(0_0%_55%)]">SKU fournisseur</label>
              <Input value={form.supplier_sku} onChange={(e) => setField('supplier_sku', e.target.value)}
                className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] h-11 text-base md:h-9 md:text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[hsl(0_0%_55%)]">Prix achat HT (€)</label>
              <Input type="number" step="0.01" inputMode="decimal" value={form.buy_price_ht}
                onChange={(e) => setField('buy_price_ht', e.target.value)}
                className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] h-11 text-base md:h-9 md:text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[hsl(0_0%_55%)]">URL produit</label>
            <Input value={form.supplier_url} onChange={(e) => setField('supplier_url', e.target.value)}
              placeholder="https://..."
              className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] h-11 text-base md:h-9 md:text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[hsl(0_0%_55%)]">Stock fournisseur</label>
              <Input type="number" inputMode="numeric" value={form.stock_supplier}
                onChange={(e) => setField('stock_supplier', e.target.value)}
                className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] h-11 text-base md:h-9 md:text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[hsl(0_0%_55%)]">Délai (jours)</label>
              <Input type="number" inputMode="numeric" value={form.shipping_time_days}
                onChange={(e) => setField('shipping_time_days', e.target.value)}
                className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] h-11 text-base md:h-9 md:text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[hsl(0_0%_55%)]">Notes</label>
            <Textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={2}
              className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] text-sm" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}
            className="border-[hsl(0_0%_20%)] text-[hsl(0_0%_70%)] min-h-[44px]">
            Annuler
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] gap-1.5">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PartSuppliersManager = ({ partId, partPrice }: PartSuppliersManagerProps) => {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PartSupplierRow | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['part-suppliers', partId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('part_suppliers')
        .select('*')
        .eq('part_id', partId)
        .order('is_primary', { ascending: false })
        .order('buy_price_ht', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as PartSupplierRow[];
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (rowId: string) => {
      const { error: e1 } = await supabase
        .from('part_suppliers')
        .update({ is_primary: false })
        .eq('part_id', partId)
        .neq('id', rowId);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from('part_suppliers')
        .update({ is_primary: true })
        .eq('id', rowId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['part-suppliers', partId] });
      toast.success('Fournisseur principal mis à jour');
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : 'Erreur';
      toast.error(`Erreur : ${msg}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (rowId: string) => {
      const { error } = await supabase.from('part_suppliers').delete().eq('id', rowId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['part-suppliers', partId] });
      toast.success('Fournisseur supprimé');
    },
    onError: () => toast.error('Erreur suppression'),
  });

  const computeMargin = (buyPrice: number | null) => {
    if (!buyPrice || !partPrice) return null;
    const marginEur = partPrice - buyPrice;
    const marginPct = (marginEur / partPrice) * 100;
    return { eur: marginEur, pct: marginPct };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[hsl(0_0%_55%)]">
          {suppliers.length} fournisseur{suppliers.length > 1 ? 's' : ''}
        </p>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 min-h-[44px] sm:min-h-0">
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </Button>
          </DialogTrigger>
          {addOpen && (
            <SupplierFormDialog partId={partId} open={addOpen} onOpenChange={setAddOpen} />
          )}
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-[hsl(0_0%_50%)]" />
        </div>
      ) : suppliers.length === 0 ? (
        <p className="text-xs text-[hsl(0_0%_40%)] py-3 text-center">
          Aucun fournisseur. Cliquez sur "Ajouter".
        </p>
      ) : (
        <div className="space-y-2">
          {suppliers.map((s) => {
            const margin = computeMargin(s.buy_price_ht);
            return (
              <div
                key={s.id}
                className={cn(
                  'rounded-xl border p-3 space-y-2',
                  s.is_primary
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-[hsl(0_0%_9%)] border-[hsl(0_0%_18%)]',
                )}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[hsl(0_0%_90%)] capitalize">
                      {s.supplier_name}
                    </span>
                    {s.is_primary && (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Principal
                      </Badge>
                    )}
                    {s.supplier_sku && (
                      <span className="text-[10px] text-[hsl(0_0%_50%)] font-mono">
                        {s.supplier_sku}
                      </span>
                    )}
                  </div>
                  {s.supplier_url && (
                    <a href={s.supplier_url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 text-xs">
                      <ExternalLink className="w-3 h-3" />
                      Voir
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-[11px]">
                  {s.buy_price_ht != null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(0_0%_15%)] text-[hsl(0_0%_70%)]">
                      <Euro className="w-3 h-3 text-amber-400" />
                      {Number(s.buy_price_ht).toFixed(2)} HT
                    </span>
                  )}
                  {margin && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
                        margin.eur > 0
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-red-500/15 text-red-300',
                      )}
                    >
                      Marge {margin.eur.toFixed(2)}€ ({margin.pct.toFixed(0)}%)
                    </span>
                  )}
                  {s.stock_supplier != null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(0_0%_15%)] text-[hsl(0_0%_70%)]">
                      <Package className="w-3 h-3 text-blue-400" />
                      {s.stock_supplier}
                    </span>
                  )}
                  {s.shipping_time_days != null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(0_0%_15%)] text-[hsl(0_0%_70%)]">
                      <Truck className="w-3 h-3 text-violet-400" />
                      {s.shipping_time_days}j
                    </span>
                  )}
                </div>

                {s.notes && (
                  <p className="text-[11px] text-[hsl(0_0%_50%)] italic">{s.notes}</p>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {!s.is_primary && (
                    <Button size="sm" variant="outline"
                      className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs gap-1 min-h-[44px] sm:min-h-0"
                      onClick={() => setPrimaryMutation.mutate(s.id)}
                      disabled={setPrimaryMutation.isPending}>
                      <Star className="w-3 h-3" />
                      Définir principal
                    </Button>
                  )}
                  <Button size="sm" variant="outline"
                    className="border-[hsl(0_0%_25%)] text-[hsl(0_0%_70%)] hover:bg-[hsl(0_0%_15%)] text-xs gap-1 min-h-[44px] sm:min-h-0"
                    onClick={() => setEditingRow(s)}>
                    <Pencil className="w-3 h-3" />
                    Modifier
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs gap-1 min-h-[44px] sm:min-h-0">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[hsl(0_0%_12%)] border-[hsl(0_0%_18%)]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[hsl(0_0%_90%)]">
                          Supprimer ce fournisseur ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          La ligne {s.supplier_name} sera supprimée définitivement.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-[hsl(0_0%_15%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_70%)]">
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-white"
                          onClick={() => deleteMutation.mutate(s.id)}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingRow && (
        <SupplierFormDialog
          partId={partId}
          initial={editingRow}
          rowId={editingRow.id}
          open={!!editingRow}
          onOpenChange={(v) => { if (!v) setEditingRow(null); }}
        />
      )}
    </div>
  );
};

export default PartSuppliersManager;
