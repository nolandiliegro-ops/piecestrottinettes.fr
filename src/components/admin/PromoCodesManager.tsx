import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  active: boolean;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  created_at: string;
}

const PromoCodesManager = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState('shipping');
  const [newValue, setNewValue] = useState('100');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [newExpires, setNewExpires] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: codes, isLoading } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PromoCode[];
    },
  });

  const handleCreate = async () => {
    if (!newCode.trim()) { toast.error('Code requis'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('promo_codes').insert({
        code: newCode.toUpperCase().trim(),
        discount_type: newType,
        discount_value: parseFloat(newValue) || 0,
        max_uses: newMaxUses ? parseInt(newMaxUses) : null,
        expires_at: newExpires || null,
      });
      if (error) throw error;
      toast.success('Code promo créé');
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      setCreateOpen(false);
      setNewCode(''); setNewValue('100'); setNewMaxUses(''); setNewExpires('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from('promo_codes').update({ active: !currentActive }).eq('id', id);
    if (error) toast.error(error.message);
    else queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce code promo ?')) return;
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Code supprimé'); queryClient.invalidateQueries({ queryKey: ['promo-codes'] }); }
  };

  const typeLabel = (t: string) => {
    if (t === 'shipping') return 'Livraison gratuite';
    if (t === 'percent') return 'Pourcentage';
    return 'Montant fixe';
  };

  const valueLabel = (type: string, value: number) => {
    if (type === 'shipping') return `${value}%`;
    if (type === 'percent') return `${value}%`;
    return `${value}€`;
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Codes Promo</h3>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />Créer un code</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau code promo</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Code</Label>
                <Input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="Ex: PROMO20" className="uppercase" />
              </div>
              <div>
                <Label>Type de réduction</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipping">Livraison gratuite</SelectItem>
                    <SelectItem value="percent">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valeur ({newType === 'fixed' ? '€' : '%'})</Label>
                <Input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
              </div>
              <div>
                <Label>Utilisations max (vide = illimité)</Label>
                <Input type="number" value={newMaxUses} onChange={(e) => setNewMaxUses(e.target.value)} placeholder="Illimité" />
              </div>
              <div>
                <Label>Date d'expiration (optionnel)</Label>
                <Input type="datetime-local" value={newExpires} onChange={(e) => setNewExpires(e.target.value)} />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Créer le code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Utilisations</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono font-bold">{c.code}</TableCell>
                <TableCell>{typeLabel(c.discount_type)}</TableCell>
                <TableCell>{valueLabel(c.discount_type, c.discount_value)}</TableCell>
                <TableCell>{c.current_uses}{c.max_uses ? ` / ${c.max_uses}` : ''}</TableCell>
                <TableCell>
                  <Badge variant={c.active ? "default" : "secondary"}>
                    {c.active ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => toggleActive(c.id, c.active)} title={c.active ? 'Désactiver' : 'Activer'}>
                      {c.active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!codes || codes.length === 0) && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun code promo</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PromoCodesManager;
