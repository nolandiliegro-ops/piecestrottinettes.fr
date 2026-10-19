import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  PackageCheck, Truck, MessageSquare, Bot, AlertTriangle, TrendingUp, TrendingDown,
  Plus, Ticket, ExternalLink, ChevronRight, Euro,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

/* ───────────────────────── Types & data ───────────────────────── */

interface DashboardStats {
  ca_today: number;
  ca_7d: number;
  ca_30d: number;
  ca_prev_30d: number;
  ca_total: number;
  orders_to_prepare: number;
  orders_to_ship: number;
  messages_pending: number;
  imports_scooters: number;
  imports_parts: number;
  stock_low: number;
  parts_published: number;
  scooters_published: number;
  sales_30d: { day: string; total: number }[];
  recent_orders: {
    id: string; order_number: string; total_ttc: number; status: string;
    created_at: string; client: string | null;
  }[];
}

const useDashboardStats = () =>
  useQuery({
    queryKey: ['admin-dashboard-stats'],
    staleTime: 60_000,
    queryFn: async (): Promise<DashboardStats> => {
      // RPC créée le 19/10/2026 — pas encore dans types.ts généré, d'où le cast.
      const { data, error } = await (supabase.rpc as CallableFunction)('admin_dashboard_stats');
      if (error) throw error;
      return data as DashboardStats;
    },
  });

/* ───────────────────────── Formatters ───────────────────────── */

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const eurCompact = (v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10} k€` : `${Math.round(v)} €`);
const dayShort = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const dateShort = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Tous les statuts réels de la base — awaiting_payment inclus (l'ancien écran l'ignorait). */
const STATUS_FR: Record<string, { label: string; cls: string }> = {
  awaiting_payment: { label: 'En attente', cls: 'bg-amber-100 text-amber-800' },
  pending: { label: 'En attente', cls: 'bg-amber-100 text-amber-800' },
  paid: { label: 'Payé', cls: 'bg-[hsl(var(--admin-accent)/0.15)] text-[hsl(var(--admin-accent))]' },
  processing: { label: 'En préparation', cls: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Expédié', cls: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Livré', cls: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Annulé', cls: 'bg-red-100 text-red-700' },
};

/* ───────────────────────── Petits blocs ───────────────────────── */

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('admin-skeleton rounded-xl', className)} />
);

const CaTile = ({ label, value, delta }: { label: string; value: number; delta?: number | null }) => (
  <div className="admin-glass-card rounded-2xl p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--admin-text-muted))]">{label}</p>
    <p className="font-display text-3xl md:text-4xl tracking-wide mt-1 text-[hsl(var(--admin-text))]">{eur.format(value)}</p>
    {delta != null && Number.isFinite(delta) && (
      <p className={cn('flex items-center gap-1 text-xs font-semibold mt-1', delta >= 0 ? 'text-[hsl(var(--admin-accent))]' : 'text-red-600')}>
        {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {delta >= 0 ? '+' : ''}{Math.round(delta)}&nbsp;% vs 30 j précédents
      </p>
    )}
  </div>
);

interface TodoItem {
  to: string; icon: typeof PackageCheck; label: string; count: number;
  urgent?: boolean;
}

const TodoRow = ({ item }: { item: TodoItem }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className="flex items-center gap-3 min-h-[52px] px-3 rounded-xl hover:bg-[hsl(var(--aov04))] transition-colors"
    >
      <span className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
        item.urgent ? 'bg-orange-100 text-orange-600' : 'bg-[hsl(var(--admin-accent)/0.12)] text-[hsl(var(--admin-accent))]'
      )}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="flex-1 text-sm font-medium text-[hsl(var(--admin-text))]">{item.label}</span>
      <span className={cn(
        'min-w-[26px] h-[26px] px-2 rounded-full flex items-center justify-center text-sm font-bold',
        item.count > 0
          ? (item.urgent ? 'bg-orange-600 text-white' : 'bg-[hsl(var(--admin-accent))] text-white')
          : 'bg-[hsl(var(--aov06))] text-[hsl(var(--admin-text-muted))]'
      )}>
        {item.count}
      </span>
      <ChevronRight className="w-4 h-4 text-[hsl(var(--admin-text-muted))]" />
    </Link>
  );
};

const SalesTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="admin-glass-card rounded-lg px-3 py-2 text-sm">
      <p className="text-[hsl(var(--admin-text-muted))] text-xs">{label}</p>
      <p className="font-bold text-[hsl(var(--admin-text))]">{eur.format(payload[0].value)}</p>
    </div>
  );
};

/* ───────────────────────── Dashboard ───────────────────────── */

const AdminDashboard = () => {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (error) {
    return (
      <div className="p-4">
        <div className="admin-glass-card rounded-2xl p-5 text-sm text-red-700">
          Impossible de charger les chiffres : {(error as Error).message}
        </div>
      </div>
    );
  }

  const delta30 = stats && stats.ca_prev_30d > 0
    ? ((stats.ca_30d - stats.ca_prev_30d) / stats.ca_prev_30d) * 100
    : null;

  const todos: TodoItem[] = stats ? [
    // Chaque ligne nomme le statut EXACT de l'écran Commandes et y arrive pré-filtrée (acté 19/10)
    { to: '/admin/commandes?statut=paid', icon: PackageCheck, label: 'À préparer — statut « Payé »', count: stats.orders_to_prepare, urgent: true },
    { to: '/admin/commandes?statut=processing', icon: Truck, label: 'À expédier — statut « En préparation »', count: stats.orders_to_ship, urgent: true },
    { to: '/admin/messages', icon: MessageSquare, label: 'Messages en attente', count: stats.messages_pending },
    { to: '/admin/bots', icon: Bot, label: 'Trottinettes bot à trier', count: stats.imports_scooters },
    { to: '/admin/catalogue/pieces?statut=stock-bas', icon: AlertTriangle, label: 'Stock bas (pièces publiées)', count: stats.stock_low },
  ] : [];

  const chartData = (stats?.sales_30d ?? []).map(d => ({
    day: dayShort.format(new Date(d.day)),
    total: Number(d.total),
  }));

  return (
    <div className="p-3 md:p-5 space-y-3 md:space-y-4 max-w-6xl">
      <div className="flex items-center justify-between px-1">
        <h1 className="font-display text-2xl tracking-wide text-[hsl(var(--admin-text))]"><span className="admin-title-marker">ACCUEIL</span></h1>
        <p className="text-xs text-[hsl(var(--admin-text-muted))]">
          {stats ? `${stats.parts_published} pièces · ${stats.scooters_published} trott. publiées` : ''}
        </p>
      </div>

      {/* Bandeau CA — encaissé réel (payé → livré) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CaTile label="Aujourd'hui" value={stats.ca_today} />
          <CaTile label="7 jours" value={stats.ca_7d} />
          <CaTile label="30 jours" value={stats.ca_30d} delta={delta30} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* À traiter */}
        <div className="admin-glass-card rounded-2xl p-3 md:p-4">
          <h2 className="text-sm font-black uppercase tracking-wide px-3 pt-1 pb-2 text-[hsl(var(--admin-text))]">À traiter</h2>
          {isLoading ? (
            <div className="space-y-2 p-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
          ) : (
            <div>{todos.map(t => <TodoRow key={t.label} item={t} />)}</div>
          )}
        </div>

        {/* Ventes 30 jours */}
        <div className="admin-glass-card rounded-2xl p-3 md:p-4">
          <div className="flex items-baseline justify-between px-3 pt-1 pb-2">
            <h2 className="text-sm font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">Ventes — 30 jours</h2>
            {stats && <span className="text-xs text-[hsl(var(--admin-text-muted))]">Encaissé depuis le début : {eur.format(stats.ca_total)}</span>}
          </div>
          {isLoading ? (
            <Skeleton className="h-44 m-2" />
          ) : (
            <div className="h-44 md:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="hsl(40 14% 90%)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }}
                    tickLine={false} axisLine={false} interval={6}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }}
                    tickLine={false} axisLine={false} width={42}
                    tickFormatter={eurCompact} allowDecimals={false}
                  />
                  <Tooltip content={<SalesTooltip />} cursor={{ fill: 'hsl(0 0% 10% / 0.05)' }} />
                  <Bar dataKey="total" fill="hsl(140 26% 39%)" radius={[4, 4, 0, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {[
          { to: '/admin/catalogue/pieces', icon: Plus, label: 'Ajouter une pièce' },
          { to: '/admin/marketing', icon: Ticket, label: 'Codes promo' },
          { to: '/', icon: ExternalLink, label: 'Voir le site', external: true },
        ].map(a => {
          const Icon = a.icon;
          const inner = (
            <>
              <Icon className="w-5 h-5 text-[hsl(var(--admin-accent))]" />
              <span className="text-xs md:text-sm font-semibold text-[hsl(var(--admin-text))] text-center">{a.label}</span>
            </>
          );
          return a.external ? (
            <a key={a.label} href={a.to} target="_blank" rel="noreferrer"
               className="admin-glass-card rounded-2xl min-h-[64px] flex flex-col items-center justify-center gap-1.5 p-2 hover:bg-[hsl(var(--aov03))] transition-colors">
              {inner}
            </a>
          ) : (
            <Link key={a.label} to={a.to}
                  className="admin-glass-card rounded-2xl min-h-[64px] flex flex-col items-center justify-center gap-1.5 p-2 hover:bg-[hsl(var(--aov03))] transition-colors">
              {inner}
            </Link>
          );
        })}
      </div>

      {/* Commandes récentes */}
      <div className="admin-glass-card rounded-2xl p-3 md:p-4">
        <div className="flex items-center justify-between px-3 pt-1 pb-2">
          <h2 className="text-sm font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">Commandes récentes</h2>
          <Link to="/admin/commandes" className="text-xs font-semibold text-[hsl(var(--admin-accent))] hover:underline">
            Tout voir
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
        ) : !stats?.recent_orders.length ? (
          <p className="text-sm text-[hsl(var(--admin-text-muted))] text-center py-6">Aucune commande</p>
        ) : (
          <div>
            {stats.recent_orders.map(o => {
              const st = STATUS_FR[o.status] ?? { label: o.status, cls: 'bg-[hsl(var(--aov06))] text-[hsl(var(--admin-text-muted))]' };
              return (
                <Link
                  key={o.id}
                  to="/admin/commandes"
                  className="flex items-center gap-3 min-h-[52px] px-3 rounded-xl hover:bg-[hsl(var(--aov04))] transition-colors"
                >
                  <Euro className="w-4 h-4 text-[hsl(var(--admin-text-muted))] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[hsl(var(--admin-text))] truncate">#{o.order_number}</p>
                    <p className="text-xs text-[hsl(var(--admin-text-muted))] truncate">
                      {o.client || '—'} · {dateShort.format(new Date(o.created_at))}
                    </p>
                  </div>
                  <span className={cn('text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap', st.cls)}>{st.label}</span>
                  <span className="text-sm font-bold text-[hsl(var(--admin-text))] whitespace-nowrap">{eur.format(o.total_ttc)}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
