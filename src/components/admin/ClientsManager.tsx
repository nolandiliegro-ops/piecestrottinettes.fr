import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search, Download, Users, Package, Wrench, MessageSquare,
  Mail, Calendar, TrendingUp, Loader2, ChevronRight, X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { formatPrice } from '@/lib/formatPrice';
import { cn } from '@/lib/utils';

type ClientSource = 'Inscription' | 'Commande' | 'Garage' | 'Contact' | 'Guest';
type FilterId = 'all' | 'with_orders' | 'no_orders' | 'active' | 'inactive';

interface ClientRow {
  key: string;
  userId: string | null;
  email: string;
  name: string;
  registeredAt: string | null;
  ordersCount: number;
  totalSpent: number;
  scooters: { name: string; nickname: string | null }[];
  lastMessage: { text: string; at: string } | null;
  lastActivity: string | null;
  source: ClientSource;
  isActive: boolean;
  performancePoints: number;
  orders: { id: string; order_number: string; total_ttc: number; status: string; created_at: string }[];
}

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'with_orders', label: 'Avec commandes' },
  { id: 'no_orders', label: 'Sans commande' },
  { id: 'active', label: 'Actifs' },
  { id: 'inactive', label: 'Inactifs' },
];

const SOURCE_COLORS: Record<ClientSource, string> = {
  Inscription: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Commande: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Garage: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Contact: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Guest: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

function useClientsData() {
  return useQuery({
    queryKey: ['admin-clients-consolidated'],
    staleTime: 60_000,
    queryFn: async (): Promise<ClientRow[]> => {
      const [profilesRes, ordersRes, garageRes, messagesRes, contactsRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name, performance_points, created_at'),
        supabase.from('orders').select('id, order_number, user_id, customer_email, customer_first_name, customer_last_name, total_ttc, status, created_at').order('created_at', { ascending: false }),
        supabase.from('user_garage').select('user_id, nickname, scooter_model_id, scooter_models(name, brands(name))'),
        supabase.from('order_messages').select('user_id, message, created_at, sender_type').order('created_at', { ascending: false }).limit(2000),
        supabase.from('contact_messages').select('email, name, matched_user_id, created_at, message').order('created_at', { ascending: false }),
      ]);

      const profiles = profilesRes.data ?? [];
      const orders = ordersRes.data ?? [];
      const garage = garageRes.data ?? [];
      const messages = messagesRes.data ?? [];
      const contacts = contactsRes.data ?? [];

      const map = new Map<string, ClientRow>();

      const upsert = (key: string, partial: Partial<ClientRow>): ClientRow => {
        const existing = map.get(key) ?? {
          key,
          userId: null, email: '', name: '',
          registeredAt: null, ordersCount: 0, totalSpent: 0,
          scooters: [], lastMessage: null, lastActivity: null,
          source: 'Inscription' as ClientSource, isActive: false,
          performancePoints: 0, orders: [],
        };
        const merged = { ...existing, ...partial };
        map.set(key, merged);
        return merged;
      };

      // 1. Profiles → registered users
      // We need email — fetch via orders or contacts (no auth.users access). Match later.
      profiles.forEach(p => {
        const key = `uid:${p.id}`;
        upsert(key, {
          userId: p.id,
          name: p.display_name || 'Rider',
          registeredAt: p.created_at,
          performancePoints: p.performance_points ?? 0,
          source: 'Inscription',
        });
      });

      // 2. Orders → consolidate by user_id (or email for guests)
      orders.forEach(o => {
        const key = o.user_id ? `uid:${o.user_id}` : `email:${o.customer_email.toLowerCase()}`;
        const current = map.get(key);
        const fullName = `${o.customer_first_name} ${o.customer_last_name}`.trim();
        const isPaid = ['paid', 'processing', 'shipped', 'delivered'].includes(o.status);

        const merged = upsert(key, {
          userId: o.user_id ?? current?.userId ?? null,
          email: current?.email || o.customer_email,
          name: current?.name && current.name !== 'Rider' ? current.name : fullName || current?.name || 'Client',
          source: current?.source ?? (o.user_id ? 'Commande' : 'Guest'),
        });
        merged.ordersCount += 1;
        if (isPaid) merged.totalSpent += Number(o.total_ttc ?? 0);
        merged.orders.push({
          id: o.id, order_number: o.order_number,
          total_ttc: Number(o.total_ttc ?? 0), status: o.status, created_at: o.created_at,
        });
        if (!merged.lastActivity || o.created_at > merged.lastActivity) {
          merged.lastActivity = o.created_at;
        }
        map.set(key, merged);
      });

      // 3. Garage → attach scooters
      garage.forEach((g: any) => {
        if (!g.user_id) return;
        const key = `uid:${g.user_id}`;
        const current = map.get(key);
        const scooterName = g.scooter_models
          ? `${g.scooter_models.brands?.name ?? ''} ${g.scooter_models.name}`.trim()
          : 'Trottinette';
        const merged = upsert(key, {
          userId: g.user_id,
          source: current?.source && current.source !== 'Inscription' ? current.source : 'Garage',
        });
        merged.scooters.push({ name: scooterName, nickname: g.nickname });
        map.set(key, merged);
      });

      // 4. Messages → last message + activity bump
      messages.forEach(m => {
        if (!m.user_id) return;
        const key = `uid:${m.user_id}`;
        const current = map.get(key);
        if (!current) return;
        if (!current.lastMessage || m.created_at > current.lastMessage.at) {
          current.lastMessage = { text: m.message.slice(0, 80), at: m.created_at };
        }
        if (!current.lastActivity || m.created_at > current.lastActivity) {
          current.lastActivity = m.created_at;
        }
        map.set(key, current);
      });

      // 5. Contact messages → match via matched_user_id or email
      contacts.forEach(c => {
        const key = c.matched_user_id ? `uid:${c.matched_user_id}` : `email:${c.email.toLowerCase()}`;
        const current = map.get(key);
        const merged = upsert(key, {
          userId: current?.userId ?? c.matched_user_id ?? null,
          email: current?.email || c.email,
          name: current?.name && current.name !== 'Rider' && current.name !== 'Client' ? current.name : c.name,
          source: current?.source ?? 'Contact',
        });
        if (!merged.lastActivity || c.created_at > merged.lastActivity) {
          merged.lastActivity = c.created_at;
        }
        if (!merged.lastMessage || c.created_at > merged.lastMessage.at) {
          merged.lastMessage = { text: c.message.slice(0, 80), at: c.created_at };
        }
        map.set(key, merged);
      });

      // Compute active flag
      const now = Date.now();
      const result = Array.from(map.values()).map(c => ({
        ...c,
        isActive: c.lastActivity ? differenceInDays(now, new Date(c.lastActivity).getTime()) <= 90 : false,
      }));

      // Sort by last activity DESC (nulls last)
      result.sort((a, b) => {
        if (!a.lastActivity && !b.lastActivity) return 0;
        if (!a.lastActivity) return 1;
        if (!b.lastActivity) return -1;
        return b.lastActivity.localeCompare(a.lastActivity);
      });

      return result;
    },
  });
}

function exportToCSV(rows: ClientRow[]) {
  const headers = ['Nom', 'Email', 'Date inscription', 'Nb commandes', 'CA total (€)', 'Scooters', 'Dernière activité', 'Source', 'Statut'];
  const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map(r => [
    escape(r.name),
    escape(r.email),
    r.registeredAt ? format(new Date(r.registeredAt), 'yyyy-MM-dd') : '',
    String(r.ordersCount),
    r.totalSpent.toFixed(2).replace('.', ','),
    escape(r.scooters.map(s => s.nickname ? `${s.name} (${s.nickname})` : s.name).join(' | ')),
    r.lastActivity ? format(new Date(r.lastActivity), 'yyyy-MM-dd HH:mm') : '',
    r.source,
    r.isActive ? 'Actif' : 'Inactif',
  ].join(';'));
  const csv = '\uFEFF' + [headers.join(';'), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clients-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ClientDetailSheet({ client, onClose }: { client: ClientRow | null; onClose: () => void }) {
  const navigate = useNavigate();
  const open = !!client;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl bg-[hsl(0_0%_10%)] border-l border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)] p-0 overflow-hidden flex flex-col">
        {client && (
          <>
            <SheetHeader className="p-6 border-b border-[hsl(0_0%_18%)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    {(client.name || client.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="text-[hsl(0_0%_95%)] truncate text-left">{client.name}</SheetTitle>
                    <p className="text-xs text-[hsl(0_0%_55%)] truncate">{client.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn('shrink-0', SOURCE_COLORS[client.source])}>{client.source}</Badge>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon={Package} label="Commandes" value={String(client.ordersCount)} />
                  <StatCard icon={TrendingUp} label="CA total" value={formatPrice(client.totalSpent)} />
                  <StatCard icon={Wrench} label="Garage" value={String(client.scooters.length)} />
                  <StatCard icon={Calendar} label="XP" value={String(client.performancePoints)} />
                </div>

                {/* Orders */}
                {client.orders.length > 0 && (
                  <Section title={`Commandes (${client.orders.length})`}>
                    <div className="space-y-2">
                      {client.orders.slice(0, 8).map(o => (
                        <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-[hsl(0_0%_14%)] border border-[hsl(0_0%_18%)] text-sm">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{o.order_number}</p>
                            <p className="text-xs text-[hsl(0_0%_55%)]">{format(new Date(o.created_at), 'dd MMM yyyy', { locale: fr })} · {o.status}</p>
                          </div>
                          <p className="font-semibold text-primary shrink-0 ml-3">{formatPrice(o.total_ttc)}</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Garage */}
                {client.scooters.length > 0 && (
                  <Section title={`Trottinettes (${client.scooters.length})`}>
                    <div className="space-y-2">
                      {client.scooters.map((s, i) => (
                        <div key={i} className="p-3 rounded-lg bg-[hsl(0_0%_14%)] border border-[hsl(0_0%_18%)] text-sm flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">{s.name}</span>
                          {s.nickname && <span className="text-xs text-[hsl(0_0%_55%)] truncate">— {s.nickname}</span>}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Last message */}
                {client.lastMessage && (
                  <Section title="Dernier message">
                    <button
                      onClick={() => {
                        if (client.userId) {
                          navigate(`/admin?tab=messages&garage=true&userId=${client.userId}`);
                        } else {
                          navigate('/admin?tab=messages');
                        }
                        onClose();
                      }}
                      className="w-full text-left p-3 rounded-lg bg-[hsl(0_0%_14%)] border border-[hsl(0_0%_18%)] hover:border-primary/50 transition-colors"
                    >
                      <p className="text-sm text-[hsl(0_0%_85%)] line-clamp-2">{client.lastMessage.text}</p>
                      <p className="text-xs text-[hsl(0_0%_55%)] mt-1.5 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {format(new Date(client.lastMessage.at), 'dd MMM yyyy HH:mm', { locale: fr })}
                        <ChevronRight className="w-3 h-3 ml-auto" />
                      </p>
                    </button>
                  </Section>
                )}

                {client.registeredAt && (
                  <p className="text-xs text-[hsl(0_0%_55%)] pt-2 border-t border-[hsl(0_0%_18%)]">
                    Inscrit le {format(new Date(client.registeredAt), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="p-3 rounded-lg bg-[hsl(0_0%_14%)] border border-[hsl(0_0%_18%)]">
    <div className="flex items-center gap-2 text-[hsl(0_0%_55%)] text-xs mb-1">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
    <p className="text-lg font-bold text-[hsl(0_0%_95%)]">{value}</p>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-xs uppercase tracking-wider text-[hsl(0_0%_55%)] font-semibold mb-2">{title}</h3>
    {children}
  </div>
);

export default function ClientsManager() {
  const { data: clients = [], isLoading } = useClientsData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [selected, setSelected] = useState<ClientRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      if (filter === 'with_orders' && c.ordersCount === 0) return false;
      if (filter === 'no_orders' && c.ordersCount > 0) return false;
      if (filter === 'active' && !c.isActive) return false;
      if (filter === 'inactive' && c.isActive) return false;
      return true;
    });
  }, [clients, search, filter]);

  const counts = useMemo(() => ({
    all: clients.length,
    with_orders: clients.filter(c => c.ordersCount > 0).length,
    no_orders: clients.filter(c => c.ordersCount === 0).length,
    active: clients.filter(c => c.isActive).length,
    inactive: clients.filter(c => !c.isActive).length,
  }), [clients]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-[hsl(0_0%_95%)]">Clients</h1>
            <Badge variant="outline" className="text-[hsl(0_0%_55%)] border-[hsl(0_0%_25%)]">{clients.length}</Badge>
          </div>
          <Button
            onClick={() => exportToCSV(filtered)}
            size="sm"
            className="bg-primary hover:bg-primary/90 gap-2"
            disabled={filtered.length === 0}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(0_0%_55%)]" />
          <Input
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[hsl(0_0%_14%)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)] placeholder:text-[hsl(0_0%_45%)]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(0_0%_55%)] hover:text-[hsl(0_0%_95%)]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                filter === f.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-[hsl(0_0%_14%)] text-[hsl(0_0%_75%)] border-[hsl(0_0%_18%)] hover:border-[hsl(0_0%_30%)]'
              )}
            >
              {f.label} <span className="opacity-60 ml-1">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-[hsl(0_0%_55%)]">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun client trouvé</p>
        </div>
      )}

      {/* Desktop table */}
      {!isLoading && filtered.length > 0 && (
        <>
          <div className="hidden md:block rounded-xl border border-[hsl(0_0%_18%)] overflow-hidden bg-[hsl(0_0%_12%)]">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(0_0%_14%)] text-[hsl(0_0%_55%)] text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left p-3 font-medium">Client</th>
                  <th className="text-left p-3 font-medium">Commandes</th>
                  <th className="text-left p-3 font-medium">CA Total</th>
                  <th className="text-left p-3 font-medium">Garage</th>
                  <th className="text-left p-3 font-medium">Activité</th>
                  <th className="text-left p-3 font-medium">Source</th>
                  <th className="text-left p-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr
                    key={c.key}
                    onClick={() => setSelected(c)}
                    className="border-t border-[hsl(0_0%_18%)] hover:bg-[hsl(0_0%_14%)] cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {(c.name || c.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[hsl(0_0%_95%)] truncate">{c.name}</p>
                          <p className="text-xs text-[hsl(0_0%_55%)] truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[hsl(0_0%_85%)] font-medium">{c.ordersCount}</td>
                    <td className="p-3 text-primary font-semibold">{formatPrice(c.totalSpent)}</td>
                    <td className="p-3 text-[hsl(0_0%_85%)]">
                      {c.scooters.length > 0 ? (
                        <span title={c.scooters.map(s => s.name).join(', ')}>
                          {c.scooters.length} · <span className="text-[hsl(0_0%_55%)] text-xs">{c.scooters[0].name}</span>
                        </span>
                      ) : <span className="text-[hsl(0_0%_45%)]">—</span>}
                    </td>
                    <td className="p-3 text-xs text-[hsl(0_0%_55%)]">
                      {c.lastActivity ? format(new Date(c.lastActivity), 'dd MMM yyyy', { locale: fr }) : '—'}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn('text-[10px]', SOURCE_COLORS[c.source])}>{c.source}</Badge>
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
                        c.isActive
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-zinc-500/15 text-zinc-400'
                      )}>
                        {c.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map(c => (
              <button
                key={c.key}
                onClick={() => setSelected(c)}
                className="w-full text-left p-3 rounded-xl bg-[hsl(0_0%_12%)] border border-[hsl(0_0%_18%)] active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {(c.name || c.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[hsl(0_0%_95%)] truncate">{c.name}</p>
                    <p className="text-xs text-[hsl(0_0%_55%)] truncate">{c.email}</p>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] shrink-0', SOURCE_COLORS[c.source])}>{c.source}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[hsl(0_0%_75%)]">
                    <span><Package className="w-3 h-3 inline mr-1" />{c.ordersCount}</span>
                    <span className="text-primary font-semibold">{formatPrice(c.totalSpent)}</span>
                    {c.scooters.length > 0 && <span><Wrench className="w-3 h-3 inline mr-1" />{c.scooters.length}</span>}
                  </div>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-[9px] font-semibold',
                    c.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'
                  )}>
                    {c.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <ClientDetailSheet client={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
