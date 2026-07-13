import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search, Download, Users, Package, Wrench, MessageSquare,
  Mail, Phone, TrendingUp, Loader2, ChevronRight, ChevronUp, ChevronDown,
  X, Send, Paperclip, Loader, ShoppingBag, Crown, Sparkles, UserCircle2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/formatPrice';
import { cn } from '@/lib/utils';

type ClientSource = 'Inscription' | 'Commande' | 'Garage' | 'Contact' | 'Guest';
type FilterId = 'all' | 'with_orders' | 'no_orders' | 'active' | 'inactive';
type LoyaltyTier = 'Aucun' | 'Nouveau' | 'Régulier' | 'VIP';
type LoyaltyFilter = 'all' | 'Nouveau' | 'Régulier' | 'VIP';
type SortKey = 'name' | 'orders' | 'revenue' | 'activity';
type SortDir = 'asc' | 'desc';

interface ClientOrder {
  id: string; order_number: string; total_ttc: number; status: string; created_at: string;
}
interface ClientScooter {
  name: string; nickname: string | null; power_watts: number | null; range_km: number | null;
}
interface ClientMessage {
  id: string; message: string; created_at: string; sender_type: string;
}
interface ClientRow {
  key: string; // email lowercased
  userId: string | null;
  email: string;
  name: string;
  phone: string | null;
  registeredAt: string | null;
  ordersCount: number;
  totalSpent: number;
  avgCart: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  loyaltyTier: LoyaltyTier;
  scooters: ClientScooter[];
  messages: ClientMessage[];
  messagesCount: number;
  lastMessage: { text: string; at: string } | null;
  lastActivity: string | null;
  source: ClientSource;
  isActive: boolean;
  performancePoints: number;
  orders: ClientOrder[];
  lastContactMessageId: string | null;
}

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'with_orders', label: 'Avec commandes' },
  { id: 'no_orders', label: 'Sans commande' },
  { id: 'active', label: 'Actifs' },
  { id: 'inactive', label: 'Inactifs' },
];

const LOYALTY_FILTERS: { id: LoyaltyFilter; label: string }[] = [
  { id: 'all', label: 'Toute fidélité' },
  { id: 'Nouveau', label: 'Nouveau' },
  { id: 'Régulier', label: 'Régulier' },
  { id: 'VIP', label: 'VIP' },
];

const SOURCE_COLORS: Record<ClientSource, string> = {
  Inscription: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Commande: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Garage: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Contact: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Guest: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

const LOYALTY_COLORS: Record<LoyaltyTier, string> = {
  Aucun: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  Nouveau: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  Régulier: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  VIP: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

function computeLoyalty(count: number): LoyaltyTier {
  if (count >= 5) return 'VIP';
  if (count >= 2) return 'Régulier';
  if (count === 1) return 'Nouveau';
  return 'Aucun';
}

function useClientsData() {
  return useQuery({
    queryKey: ['admin-clients-consolidated-v2'],
    staleTime: 60_000,
    queryFn: async (): Promise<ClientRow[]> => {
      const [profilesRes, ordersRes, garageRes, messagesRes, contactsRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name, performance_points, created_at'),
        supabase.from('orders').select('id, order_number, user_id, customer_email, customer_first_name, customer_last_name, customer_phone, total_ttc, status, created_at').order('created_at', { ascending: false }),
        supabase.from('user_garage').select('user_id, nickname, scooter_models(name, power_watts, range_km, brands!scooter_models_brand_id_fkey(name))'),
        supabase.from('order_messages').select('id, user_id, message, created_at, sender_type, contact_message_id').order('created_at', { ascending: false }).limit(3000),
        supabase.from('contact_messages').select('id, email, name, matched_user_id, created_at, message').order('created_at', { ascending: false }),
      ]);

      const profiles = profilesRes.data ?? [];
      const orders = ordersRes.data ?? [];
      const garage = garageRes.data ?? [];
      const messages = messagesRes.data ?? [];
      const contacts = contactsRes.data ?? [];

      // Map user_id -> email (via orders or contacts)
      const userIdToEmail = new Map<string, string>();
      orders.forEach(o => {
        if (o.user_id && o.customer_email) {
          const e = o.customer_email.toLowerCase().trim();
          if (!userIdToEmail.has(o.user_id)) userIdToEmail.set(o.user_id, e);
        }
      });
      contacts.forEach(c => {
        if (c.matched_user_id && c.email) {
          const e = c.email.toLowerCase().trim();
          if (!userIdToEmail.has(c.matched_user_id)) userIdToEmail.set(c.matched_user_id, e);
        }
      });

      const map = new Map<string, ClientRow>();

      const ensure = (email: string): ClientRow => {
        const key = email.toLowerCase().trim();
        let c = map.get(key);
        if (!c) {
          c = {
            key, userId: null, email: key, name: '', phone: null,
            registeredAt: null, ordersCount: 0, totalSpent: 0, avgCart: 0,
            firstOrderDate: null, lastOrderDate: null, loyaltyTier: 'Aucun',
            scooters: [], messages: [], messagesCount: 0, lastMessage: null,
            lastActivity: null, source: 'Inscription', isActive: false,
            performancePoints: 0, orders: [], lastContactMessageId: null,
          };
          map.set(key, c);
        }
        return c;
      };

      // 1. Profiles → seed via email mapping
      profiles.forEach(p => {
        const email = userIdToEmail.get(p.id);
        if (!email) return; // unmatched profile (no orders/contacts) — skip, can't unify
        const c = ensure(email);
        c.userId = c.userId ?? p.id;
        c.name = c.name || p.display_name || 'Rider';
        c.registeredAt = !c.registeredAt || (p.created_at && p.created_at < c.registeredAt) ? p.created_at : c.registeredAt;
        c.performancePoints = Math.max(c.performancePoints, p.performance_points ?? 0);
        if (c.source === 'Inscription' || c.source === 'Guest') c.source = 'Inscription';
      });

      // 2. Orders
      orders.forEach(o => {
        if (!o.customer_email) return;
        const c = ensure(o.customer_email);
        const fullName = `${o.customer_first_name ?? ''} ${o.customer_last_name ?? ''}`.trim();
        if (!c.name || c.name === 'Rider' || c.name === 'Client') c.name = fullName || c.name || 'Client';
        if (!c.userId && o.user_id) c.userId = o.user_id;
        if (!c.phone && o.customer_phone) c.phone = o.customer_phone;
        const isPaid = ['paid', 'processing', 'shipped', 'delivered'].includes(o.status);
        c.ordersCount += 1;
        if (isPaid) c.totalSpent += Number(o.total_ttc ?? 0);
        c.orders.push({
          id: o.id, order_number: o.order_number,
          total_ttc: Number(o.total_ttc ?? 0), status: o.status, created_at: o.created_at,
        });
        if (!c.firstOrderDate || o.created_at < c.firstOrderDate) c.firstOrderDate = o.created_at;
        if (!c.lastOrderDate || o.created_at > c.lastOrderDate) c.lastOrderDate = o.created_at;
        if (!c.lastActivity || o.created_at > c.lastActivity) c.lastActivity = o.created_at;
        // Source: prefer Commande/Guest over Inscription if no profile match
        if (c.source === 'Inscription' && !c.userId) c.source = 'Guest';
        else if (c.source === 'Inscription' && o.user_id) {/* keep Inscription */}
        else if (!['Commande', 'Garage', 'Contact', 'Inscription'].includes(c.source)) {
          c.source = o.user_id ? 'Commande' : 'Guest';
        }
      });

      // 3. Garage → via user_id
      garage.forEach((g: any) => {
        if (!g.user_id) return;
        const email = userIdToEmail.get(g.user_id);
        if (!email) return;
        const c = ensure(email);
        const sm = g.scooter_models;
        const scooterName = sm ? `${sm.brands?.name ?? ''} ${sm.name}`.trim() : 'Trottinette';
        c.scooters.push({
          name: scooterName, nickname: g.nickname,
          power_watts: sm?.power_watts ?? null, range_km: sm?.range_km ?? null,
        });
        if (c.source === 'Inscription' || c.source === 'Guest') c.source = 'Garage';
      });

      // 4. Messages
      messages.forEach(m => {
        if (!m.user_id) return;
        const email = userIdToEmail.get(m.user_id);
        if (!email) return;
        const c = ensure(email);
        c.messages.push({
          id: m.id, message: m.message, created_at: m.created_at, sender_type: m.sender_type,
        });
        c.messagesCount += 1;
        if (!c.lastMessage || m.created_at > c.lastMessage.at) {
          c.lastMessage = { text: m.message.slice(0, 80), at: m.created_at };
        }
        if (!c.lastActivity || m.created_at > c.lastActivity) c.lastActivity = m.created_at;
      });

      // 5. Contact messages
      contacts.forEach(ct => {
        if (!ct.email) return;
        const c = ensure(ct.email);
        if (!c.name || c.name === 'Rider' || c.name === 'Client') c.name = ct.name || c.name;
        if (!c.userId && ct.matched_user_id) c.userId = ct.matched_user_id;
        if (!c.lastContactMessageId) c.lastContactMessageId = ct.id;
        if (!c.lastActivity || ct.created_at > c.lastActivity) c.lastActivity = ct.created_at;
        if (!c.lastMessage || ct.created_at > c.lastMessage.at) {
          c.lastMessage = { text: ct.message.slice(0, 80), at: ct.created_at };
        }
        if (c.source === 'Inscription' && !c.userId) c.source = 'Contact';
        else if (c.source === 'Guest') c.source = 'Contact';
      });

      // Finalize
      const now = Date.now();
      const result = Array.from(map.values()).map(c => {
        c.avgCart = c.ordersCount > 0 ? c.totalSpent / c.ordersCount : 0;
        c.loyaltyTier = computeLoyalty(c.ordersCount);
        c.isActive = c.lastActivity ? differenceInDays(now, new Date(c.lastActivity).getTime()) <= 90 : false;
        if (!c.name) c.name = c.email.split('@')[0];
        // Sort orders DESC (already mostly), messages DESC
        c.orders.sort((a, b) => b.created_at.localeCompare(a.created_at));
        c.messages.sort((a, b) => b.created_at.localeCompare(a.created_at));
        return c;
      });

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
  const headers = [
    'Nom', 'Email', 'Téléphone', 'Date inscription', 'Première commande', 'Dernière commande',
    'Nb commandes', 'CA total (€)', 'Panier moyen (€)', 'Statut fidélité', 'Trottinettes',
    'Dernière activité', 'Source', 'Statut',
  ];
  const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map(r => [
    escape(r.name),
    escape(r.email),
    escape(r.phone ?? ''),
    r.registeredAt ? format(new Date(r.registeredAt), 'yyyy-MM-dd') : '',
    r.firstOrderDate ? format(new Date(r.firstOrderDate), 'yyyy-MM-dd') : '',
    r.lastOrderDate ? format(new Date(r.lastOrderDate), 'yyyy-MM-dd') : '',
    String(r.ordersCount),
    r.totalSpent.toFixed(2).replace('.', ','),
    r.avgCart.toFixed(2).replace('.', ','),
    r.loyaltyTier,
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

// ============================================================
// SendMessageDialog
// ============================================================
function SendMessageDialog({
  client, open, onClose, onSent,
}: { client: ClientRow; open: boolean; onClose: () => void; onSent: () => void }) {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() && !imageFile) {
      toast.error('Message vide');
      return;
    }
    setSending(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const fileName = `admin/${Date.now()}-${imageFile.name}`;
        const { error: upErr } = await supabase.storage
          .from('order-messages-images')
          .upload(fileName, imageFile);
        if (upErr) throw upErr;
        // Store storage path (bucket is private; signed URLs are generated on read).
        imageUrl = fileName;
      }

      const insertPayload: any = {
        sender_type: 'admin',
        message: message.trim() || '(Image)',
        image_url: imageUrl,
        order_id: null,
      };
      if (client.userId) {
        insertPayload.user_id = client.userId;
      } else if (client.lastContactMessageId) {
        insertPayload.contact_message_id = client.lastContactMessageId;
      }

      const { error: insErr } = await supabase.from('order_messages').insert(insertPayload);
      if (insErr) throw insErr;

      // Edge fn notification
      try {
        await supabase.functions.invoke('send-message-notification', {
          body: {
            recipient: 'client',
            customerEmail: client.email,
            customerName: client.name,
            messageText: message.trim(),
            imageUrl,
            userId: client.userId,
            contactMessageId: client.lastContactMessageId,
          },
        });
      } catch (e) {
        console.warn('Notification email failed', e);
      }

      toast.success('Message envoyé');
      setMessage('');
      setImageFile(null);
      onSent();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[hsl(0_0%_95%)]">
            Envoyer un message à {client.name}
          </DialogTitle>
          <p className="text-xs text-[hsl(0_0%_55%)]">{client.email}</p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Textarea
            placeholder="Votre message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="bg-[hsl(0_0%_14%)] border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)] resize-none"
          />

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-[hsl(0_0%_75%)] cursor-pointer hover:text-primary transition-colors">
              <Paperclip className="w-4 h-4" />
              {imageFile ? imageFile.name.slice(0, 30) : 'Joindre une image'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            {imageFile && (
              <button
                type="button"
                onClick={() => setImageFile(null)}
                className="text-xs text-[hsl(0_0%_55%)] hover:text-red-400"
              >
                Retirer
              </button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={sending} className="bg-primary hover:bg-primary/90 gap-2">
            {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// ClientDetailSheet
// ============================================================
function ClientDetailSheet({
  client, onClose, onMessageSent,
}: { client: ClientRow | null; onClose: () => void; onMessageSent: () => void }) {
  const navigate = useNavigate();
  const [sendOpen, setSendOpen] = useState(false);
  const open = !!client;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-[hsl(0_0%_10%)] border-l border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)] p-0 overflow-hidden flex flex-col"
      >
        {client && (
          <>
            {/* HEADER */}
            <SheetHeader className="p-6 border-b border-[hsl(0_0%_18%)] space-y-3">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0 ring-1 ring-primary/30">
                  {(client.name || client.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-[hsl(0_0%_95%)] truncate text-left text-lg">
                    {client.name}
                  </SheetTitle>
                  <p className="text-xs text-[hsl(0_0%_55%)] truncate flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3" /> {client.email}
                  </p>
                  {client.phone && (
                    <p className="text-xs text-[hsl(0_0%_55%)] truncate flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3" /> {client.phone}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Badge variant="outline" className={cn('text-[10px]', LOYALTY_COLORS[client.loyaltyTier])}>
                      {client.loyaltyTier === 'VIP' && <Crown className="w-3 h-3 mr-1" />}
                      {client.loyaltyTier === 'Régulier' && <Sparkles className="w-3 h-3 mr-1" />}
                      {client.loyaltyTier}
                    </Badge>
                    <Badge variant="outline" className={cn('text-[10px]', SOURCE_COLORS[client.source])}>
                      {client.source}
                    </Badge>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
                      client.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-500/15 text-zinc-400'
                    )}>
                      {client.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                <StatCard icon={Package} label="Cmd" value={String(client.ordersCount)} />
                <StatCard icon={TrendingUp} label="CA" value={formatPrice(client.totalSpent)} />
                <StatCard icon={ShoppingBag} label="Panier moy." value={formatPrice(client.avgCart)} />
                <StatCard icon={MessageSquare} label="Msg" value={String(client.messagesCount)} />
              </div>

              {/* Action */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={() => setSendOpen(true)}
                        disabled={!client.userId && !client.lastContactMessageId}
                        className="w-full bg-primary hover:bg-primary/90 gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Envoyer un message
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!client.userId && !client.lastContactMessageId && (
                    <TooltipContent>Client guest sans compte ni contact préalable</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </SheetHeader>

            {/* TABS */}
            <Tabs defaultValue="orders" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-6 mt-4 bg-[hsl(0_0%_14%)] border border-[hsl(0_0%_18%)]">
                <TabsTrigger value="orders" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  Commandes ({client.orders.length})
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  Messages ({client.messagesCount})
                </TabsTrigger>
                <TabsTrigger value="garage" className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  Garage ({client.scooters.length})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <div className="p-6">
                  <TabsContent value="orders" className="mt-0 space-y-2">
                    {client.orders.length === 0 ? (
                      <EmptyState icon={Package} text="Aucune commande" />
                    ) : (
                      client.orders.map(o => (
                        <button
                          key={o.id}
                          onClick={() => {
                            navigate(`/admin?tab=orders&orderId=${o.id}`);
                            onClose();
                          }}
                          className="w-full text-left flex items-center justify-between p-3 rounded-lg bg-[hsl(0_0%_14%)] border border-[hsl(0_0%_18%)] hover:border-primary/50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{o.order_number}</p>
                            <p className="text-xs text-[hsl(0_0%_55%)]">
                              {format(new Date(o.created_at), 'dd MMM yyyy', { locale: fr })} · {o.status}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <p className="font-semibold text-primary">{formatPrice(o.total_ttc)}</p>
                            <ChevronRight className="w-4 h-4 text-[hsl(0_0%_55%)]" />
                          </div>
                        </button>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="messages" className="mt-0 space-y-2">
                    {client.messages.length === 0 ? (
                      <EmptyState icon={MessageSquare} text="Aucun message" />
                    ) : (
                      client.messages.slice(0, 5).map(m => (
                        <button
                          key={m.id}
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
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={cn(
                              'text-[10px]',
                              m.sender_type === 'admin'
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            )}>
                              {m.sender_type === 'admin' ? 'Vous' : 'Client'}
                            </Badge>
                            <span className="text-xs text-[hsl(0_0%_55%)]">
                              {format(new Date(m.created_at), 'dd MMM HH:mm', { locale: fr })}
                            </span>
                          </div>
                          <p className="text-sm text-[hsl(0_0%_85%)] line-clamp-2">{m.message}</p>
                        </button>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="garage" className="mt-0 space-y-2">
                    {client.scooters.length === 0 ? (
                      <EmptyState icon={Wrench} text="Aucune trottinette" />
                    ) : (
                      client.scooters.map((s, i) => (
                        <div key={i} className="p-3 rounded-lg bg-[hsl(0_0%_14%)] border border-[hsl(0_0%_18%)]">
                          <div className="flex items-center gap-2 mb-1">
                            <Wrench className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-medium text-sm truncate">{s.name}</span>
                          </div>
                          {s.nickname && (
                            <p className="text-xs text-[hsl(0_0%_55%)] mb-1.5">« {s.nickname} »</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-[hsl(0_0%_55%)]">
                            {s.power_watts && <span>{s.power_watts}W</span>}
                            {s.range_km && <span>{s.range_km}km</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {client.registeredAt && (
                    <p className="text-xs text-[hsl(0_0%_55%)] pt-4 mt-4 border-t border-[hsl(0_0%_18%)]">
                      Inscrit le {format(new Date(client.registeredAt), 'dd MMMM yyyy', { locale: fr })}
                      {client.firstOrderDate && (
                        <> · 1ère commande {format(new Date(client.firstOrderDate), 'dd MMM yyyy', { locale: fr })}</>
                      )}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </Tabs>

            <SendMessageDialog
              client={client}
              open={sendOpen}
              onClose={() => setSendOpen(false)}
              onSent={onMessageSent}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="p-2.5 rounded-lg bg-[hsl(0_0%_14%)] border border-[hsl(0_0%_18%)]">
    <div className="flex items-center gap-1 text-[hsl(0_0%_55%)] text-[10px] mb-0.5 uppercase tracking-wider">
      <Icon className="w-3 h-3" />
      {label}
    </div>
    <p className="text-sm font-bold text-[hsl(0_0%_95%)] truncate">{value}</p>
  </div>
);

const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="text-center py-10 text-[hsl(0_0%_55%)]">
    <Icon className="w-8 h-8 mx-auto mb-2 opacity-40" />
    <p className="text-xs">{text}</p>
  </div>
);

// ============================================================
// MAIN
// ============================================================
export default function ClientsManager() {
  const { data: clients = [], isLoading, refetch } = useClientsData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [loyaltyFilter, setLoyaltyFilter] = useState<LoyaltyFilter>('all');
  const [selected, setSelected] = useState<ClientRow | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('activity');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc'); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = clients.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      if (filter === 'with_orders' && c.ordersCount === 0) return false;
      if (filter === 'no_orders' && c.ordersCount > 0) return false;
      if (filter === 'active' && !c.isActive) return false;
      if (filter === 'inactive' && c.isActive) return false;
      if (loyaltyFilter !== 'all' && c.loyaltyTier !== loyaltyFilter) return false;
      return true;
    });

    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'name': return a.name.localeCompare(b.name) * dir;
        case 'orders': return (a.ordersCount - b.ordersCount) * dir;
        case 'revenue': return (a.totalSpent - b.totalSpent) * dir;
        case 'activity': {
          const av = a.lastActivity ?? '';
          const bv = b.lastActivity ?? '';
          return av.localeCompare(bv) * dir;
        }
      }
    });
    return arr;
  }, [clients, search, filter, loyaltyFilter, sortKey, sortDir]);

  const counts = useMemo(() => ({
    all: clients.length,
    with_orders: clients.filter(c => c.ordersCount > 0).length,
    no_orders: clients.filter(c => c.ordersCount === 0).length,
    active: clients.filter(c => c.isActive).length,
    inactive: clients.filter(c => !c.isActive).length,
  }), [clients]);

  const SortHeader = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <th className={cn('text-left p-3 font-medium', className)}>
      <button
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 hover:text-[hsl(0_0%_95%)] transition-colors"
      >
        {label}
        {sortKey === k && (
          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </button>
    </th>
  );

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

        {/* Filter row 1 */}
        <div className="flex flex-wrap gap-2 mb-2">
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

        {/* Filter row 2 - loyalty */}
        <div className="flex flex-wrap gap-2">
          {LOYALTY_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setLoyaltyFilter(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1',
                loyaltyFilter === f.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-[hsl(0_0%_14%)] text-[hsl(0_0%_75%)] border-[hsl(0_0%_18%)] hover:border-[hsl(0_0%_30%)]'
              )}
            >
              {f.id === 'VIP' && <Crown className="w-3 h-3" />}
              {f.label}
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
          <UserCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
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
                  <SortHeader k="name" label="Client" />
                  <th className="text-left p-3 font-medium">Tél</th>
                  <SortHeader k="orders" label="Cmd" />
                  <SortHeader k="revenue" label="CA" />
                  <th className="text-left p-3 font-medium">Panier moy.</th>
                  <th className="text-left p-3 font-medium">Fidélité</th>
                  <SortHeader k="activity" label="Activité" />
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 ring-1 ring-primary/20">
                          {(c.name || c.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[hsl(0_0%_95%)] truncate">{c.name}</p>
                          <p className="text-xs text-[hsl(0_0%_55%)] truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-[hsl(0_0%_75%)]">
                      {c.phone ?? <span className="text-[hsl(0_0%_45%)]">—</span>}
                    </td>
                    <td className="p-3 text-[hsl(0_0%_85%)] font-medium">{c.ordersCount}</td>
                    <td className="p-3 text-primary font-semibold">{formatPrice(c.totalSpent)}</td>
                    <td className="p-3 text-[hsl(0_0%_85%)] text-xs">
                      {c.ordersCount > 0 ? formatPrice(c.avgCart) : <span className="text-[hsl(0_0%_45%)]">—</span>}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn('text-[10px]', LOYALTY_COLORS[c.loyaltyTier])}>
                        {c.loyaltyTier === 'VIP' && <Crown className="w-3 h-3 mr-1" />}
                        {c.loyaltyTier}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-[hsl(0_0%_55%)]">
                      {c.lastActivity ? format(new Date(c.lastActivity), 'dd MMM yy', { locale: fr }) : '—'}
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
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0 ring-1 ring-primary/20">
                    {(c.name || c.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[hsl(0_0%_95%)] truncate">{c.name}</p>
                    <p className="text-xs text-[hsl(0_0%_55%)] truncate">{c.email}</p>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] shrink-0', LOYALTY_COLORS[c.loyaltyTier])}>
                    {c.loyaltyTier}
                  </Badge>
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

      <ClientDetailSheet
        client={selected}
        onClose={() => setSelected(null)}
        onMessageSent={() => refetch()}
      />
    </div>
  );
}
