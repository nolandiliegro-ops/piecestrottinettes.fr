import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, RefreshCw, Bird, ExternalLink } from 'lucide-react';

interface WatcherRun {
  id: string;
  run_date: string;
  status: 'running' | 'success' | 'partial' | 'failed' | string;
  scooters_found: number;
  parts_found: number;
  scooters_inserted: number;
  parts_inserted: number;
  scooters_skipped: number;
  parts_skipped: number;
  errors_count: number;
  duration_seconds: number | null;
  summary: any;
  error_log: string | null;
  triggered_by: string | null;
  created_at: string;
}

const statusColor = (s: string) => {
  switch (s) {
    case 'success': return 'bg-emerald-600 text-white';
    case 'partial': return 'bg-amber-500 text-black';
    case 'failed':  return 'bg-red-600 text-white';
    case 'running': return 'bg-blue-600 text-white animate-pulse';
    default:        return 'bg-zinc-500 text-white';
  }
};

const WatcherControl = () => {
  const { toast } = useToast();
  const [sinceDays, setSinceDays] = useState<string>('90');
  const [minScore, setMinScore] = useState<string>('30');
  const [brands, setBrands] = useState<string>('');
  const [suppliers, setSuppliers] = useState<string>('');
  const [triggering, setTriggering] = useState(false);
  const [runs, setRuns] = useState<WatcherRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  const loadRuns = async () => {
    setLoadingRuns(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-watcher-runs');
      if (error) throw error;
      setRuns(data?.runs || []);
    } catch (e: any) {
      toast({ title: 'Erreur chargement runs', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingRuns(false);
    }
  };

  useEffect(() => {
    loadRuns();
    // Poll toutes les 5s si une run est en cours
    const interval = setInterval(() => {
      const hasRunning = runs.some(r => r.status === 'running');
      if (hasRunning) loadRuns();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs.some(r => r.status === 'running')]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const body: Record<string, unknown> = {};
      if (sinceDays.trim()) body.since_days = Number(sinceDays);
      if (minScore.trim()) body.min_score = Number(minScore);
      if (brands.trim()) body.brands_filter = brands.trim();
      if (suppliers.trim()) body.suppliers_filter = suppliers.trim();

      const { data, error } = await supabase.functions.invoke('trigger-watcher', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: '🦅 Le Veilleur lancé',
        description: 'Le workflow GitHub démarre dans 5–15s. Rafraîchis l\'historique pour suivre.',
      });
      setTimeout(loadRuns, 8000);
    } catch (e: any) {
      toast({ title: 'Trigger échoué', description: e.message, variant: 'destructive' });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bird className="w-6 h-6 text-emerald-500" />
            Le Veilleur
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Agent autonome de veille hebdomadaire — trottinettes & pièces. Trigger manuel ou cron dimanche 21h UTC.
          </p>
        </div>
        <a
          href="https://github.com/nolandiliegro-ops/piecestrottinettes.fr/actions/workflows/weekly-watcher.yml"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          GitHub Actions <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Trigger panel */}
      <div className="rounded-2xl border border-[hsl(0_0%_18%)] bg-[hsl(0_0%_100%/0.03)] p-5 space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Lancer une veille</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="since_days" className="text-xs">Lookback (jours)</Label>
            <Input id="since_days" type="number" min="1" value={sinceDays} onChange={e => setSinceDays(e.target.value)} placeholder="90" className="bg-white text-zinc-900 placeholder:text-zinc-400" />
          </div>
          <div>
            <Label htmlFor="min_score" className="text-xs">Score min (0-100)</Label>
            <Input id="min_score" type="number" min="0" max="100" value={minScore} onChange={e => setMinScore(e.target.value)} placeholder="30" className="bg-white text-zinc-900 placeholder:text-zinc-400" />
          </div>
          <div>
            <Label htmlFor="brands" className="text-xs">Marques (CSV, vide = toutes)</Label>
            <Input id="brands" value={brands} onChange={e => setBrands(e.target.value)} placeholder="Dualtron,Xiaomi" className="bg-white text-zinc-900 placeholder:text-zinc-400" />
          </div>
          <div>
            <Label htmlFor="suppliers" className="text-xs">Fournisseurs (CSV, vide = tous)</Label>
            <Input id="suppliers" value={suppliers} onChange={e => setSuppliers(e.target.value)} placeholder="Wattiz,eWheel" className="bg-white text-zinc-900 placeholder:text-zinc-400" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleTrigger} disabled={triggering} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {triggering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Lancer la veille maintenant
          </Button>
          <Button variant="outline" onClick={loadRuns} disabled={loadingRuns} className="bg-white text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900 border-zinc-300">
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingRuns ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-[hsl(0_0%_18%)] bg-[hsl(0_0%_100%/0.03)] p-5 space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Historique (20 dernières runs)
        </h3>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune run encore enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead className="text-right">Scooters</TableHead>
                  <TableHead className="text-right">Pièces</TableHead>
                  <TableHead className="text-right">Erreurs</TableHead>
                  <TableHead className="text-right">Durée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">
                      {new Date(r.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor(r.status)}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.triggered_by || '—'}</TableCell>
                    <TableCell className="text-right text-xs">
                      <span className="text-emerald-500 font-semibold">{r.scooters_inserted}</span>
                      <span className="text-muted-foreground"> / {r.scooters_found}</span>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      <span className="text-emerald-500 font-semibold">{r.parts_inserted}</span>
                      <span className="text-muted-foreground"> / {r.parts_found}</span>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {r.errors_count > 0 ? (
                        <span className="text-red-500 font-semibold">{r.errors_count}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {r.duration_seconds != null ? `${r.duration_seconds}s` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatcherControl;
