import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronDown, ShoppingBag, ArrowRight, Loader2, Wrench, Check, MapPin, Truck, ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/formatPrice';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useOrderItemsInstallationStatus } from '@/hooks/useGarageModifications';
import MarkAsInstalledDialog from './MarkAsInstalledDialog';

// Status pipeline
const STATUS_PIPELINE = [
  { key: 'awaiting_payment', label: 'En attente' },
  { key: 'paid', label: 'Payé' },
  { key: 'processing', label: 'Préparation' },
  { key: 'shipped', label: 'Expédié' },
  { key: 'delivered', label: 'Livré' },
];

const statusConfig: Record<string, { label: string; bgClass: string; textClass: string }> = {
  awaiting_payment: { label: "En attente de paiement", bgClass: "bg-orange-500/15", textClass: "text-orange-600" },
  pending: { label: "En attente", bgClass: "bg-orange-500/15", textClass: "text-orange-600" },
  paid: { label: "Payé", bgClass: "bg-green-500/15", textClass: "text-green-600" },
  processing: { label: "En préparation", bgClass: "bg-blue-500/15", textClass: "text-blue-600" },
  shipped: { label: "Expédié", bgClass: "bg-purple-500/15", textClass: "text-purple-600" },
  delivered: { label: "Livré", bgClass: "bg-emerald-700/15", textClass: "text-emerald-700" },
  cancelled: { label: "Annulé", bgClass: "bg-red-500/15", textClass: "text-red-600" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <div className={cn("px-4 py-1.5 rounded-full border border-current/20", config.bgClass, config.textClass)}>
      <span className="text-xs font-semibold tracking-wide uppercase">{config.label}</span>
    </div>
  );
};

// Timeline Component
const OrderTimeline = ({ status }: { status: string }) => {
  const currentIndex = STATUS_PIPELINE.findIndex(s => s.key === status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Commande annulée</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-1 py-3 px-2">
      {STATUS_PIPELINE.map((step, i) => {
        const isCompleted = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-3 h-3 rounded-full border-2 transition-all",
                isCompleted ? "bg-mineral border-mineral" : "bg-transparent border-carbon/20",
                isCurrent && "ring-2 ring-mineral/30 ring-offset-1"
              )} />
              <span className={cn(
                "text-[9px] font-medium text-center leading-tight whitespace-nowrap",
                isCompleted ? "text-mineral" : "text-carbon/40"
              )}>
                {step.label}
              </span>
            </div>
            {i < STATUS_PIPELINE.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-1 rounded-full mt-[-12px]",
                i < currentIndex ? "bg-mineral" : "bg-carbon/10"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Order Items Details (Expandable)
const OrderItemsDetails = ({ order }: { order: Order }) => {
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string; part_id: string | null; part_name: string; part_image_url: string | null;
  } | null>(null);
  const navigate = useNavigate();

  const { data: items, isLoading } = useQuery({
    queryKey: ['order-items', order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, part:parts(difficulty_level, category:categories(name))')
        .eq('order_id', order.id);
      if (error) throw error;
      return data;
    },
  });

  const orderItemIds = useMemo(() => items?.map(item => item.id) || [], [items]);
  const { data: installationStatus = {} } = useOrderItemsInstallationStatus(orderItemIds);
  const showInstallButton = order.status === 'delivered';

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="px-5 pb-5 pt-3 border-t border-carbon/10 space-y-4">
        {/* Timeline */}
        <OrderTimeline status={order.status} />

        {/* Tracking Number */}
        {order.tracking_number && (order.status === 'shipped' || order.status === 'delivered') && (
          <div className="flex items-center gap-3 bg-purple-500/10 rounded-xl p-3">
            <Truck className="w-4 h-4 text-purple-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-carbon/50 uppercase tracking-wide">Numéro de suivi</p>
              <p className="text-sm font-mono font-semibold text-purple-700">{order.tracking_number}</p>
            </div>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(order.tracking_number)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Delivery Info */}
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Address */}
          <div className="flex items-start gap-3 bg-greige/50 rounded-xl p-3 border border-carbon/5">
            <MapPin className="w-4 h-4 text-mineral mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-carbon/50 uppercase tracking-wide mb-1">Adresse de livraison</p>
              <p className="text-sm text-carbon font-medium">{order.customer_first_name} {order.customer_last_name}</p>
              <p className="text-xs text-carbon/70">{order.address}</p>
              <p className="text-xs text-carbon/70">{order.postal_code} {order.city}</p>
            </div>
          </div>

          {/* Delivery Method */}
          <div className="flex items-start gap-3 bg-greige/50 rounded-xl p-3 border border-carbon/5">
            <Truck className="w-4 h-4 text-mineral mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-carbon/50 uppercase tracking-wide mb-1">Mode de livraison</p>
              <p className="text-sm text-carbon font-medium">
                {order.delivery_method === 'express' ? 'Express (24-48h)' :
                 order.delivery_method === 'relay' ? 'Point Relais' :
                 'Standard (3-5j)'}
              </p>
              <p className="text-xs text-carbon/70">
                {order.delivery_price && order.delivery_price > 0
                  ? formatPrice(order.delivery_price)
                  : <span className="text-green-600 font-medium">Gratuit</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Articles */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4 text-mineral" />
            <span className="text-xs font-medium text-carbon/70 tracking-wide uppercase">Articles commandés</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-mineral" /></div>
          ) : (
            <div className="space-y-3">
              {items?.map((item, index) => {
                const isInstalled = installationStatus[item.id]?.installed;
                const installedAt = installationStatus[item.id]?.installedAt;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-greige/50 rounded-xl border border-carbon/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white/80 overflow-hidden flex-shrink-0 border border-carbon/10">
                        {item.part_image_url ? (
                          <img src={item.part_image_url} alt={item.part_name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-carbon/30" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-carbon text-sm truncate">{item.part_name}</p>
                        <p className="text-xs text-carbon/50">{formatPrice(item.unit_price)} × {item.quantity}</p>
                      </div>
                      <span className="font-bold text-mineral text-sm">{formatPrice(item.line_total)}</span>
                    </div>
                    {showInstallButton && item.part_id && (
                      <div className="mt-3 pt-3 border-t border-carbon/5">
                        {isInstalled ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-600">
                            <Check className="w-4 h-4" />
                            <span>Installé le {format(new Date(installedAt!), "d MMMM yyyy", { locale: fr })}</span>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setSelectedItem({ id: item.id, part_id: item.part_id, part_name: item.part_name, part_image_url: item.part_image_url })}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-mineral/10 hover:bg-mineral/20 text-mineral rounded-lg text-xs font-medium transition-colors"
                          >
                            <Wrench className="w-4 h-4" />
                            Marquer comme installé
                          </motion.button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contact Support Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-carbon/70 border-carbon/10 hover:bg-mineral/5 hover:text-mineral"
          onClick={() => navigate(`/garage?tab=messages&orderId=${order.id}&orderNumber=${order.order_number}`)}
        >
          <MessageSquare className="w-4 h-4" />
          Contacter le support
        </Button>

        {/* Branding Footer */}
        <div className="pt-3 border-t border-carbon/5 text-center relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[40px] font-display text-carbon/[0.03] tracking-[0.2em] uppercase whitespace-nowrap">ROULE RÉPARE DURE</span>
          </div>
          <span className="relative text-[10px] text-carbon/30 tracking-[0.25em] uppercase">PIÈCES TROTTINETTES · ROULE RÉPARE DURE</span>
        </div>
      </div>

      {selectedItem && selectedItem.part_id && (
        <MarkAsInstalledDialog
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          partId={selectedItem.part_id}
          partName={selectedItem.part_name}
          partImage={selectedItem.part_image_url}
          orderItemId={selectedItem.id}
          categoryName={items?.find(i => i.id === selectedItem.id)?.part?.category?.name}
          difficultyLevel={items?.find(i => i.id === selectedItem.id)?.part?.difficulty_level}
        />
      )}
    </motion.div>
  );
};

// Order type
interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_ttc: number;
  subtotal_ht: number;
  tva_amount: number;
  address: string;
  postal_code: string;
  city: string;
  customer_first_name: string;
  customer_last_name: string;
  delivery_method: string | null;
  delivery_price: number | null;
  tracking_number: string | null;
}

// Order Card
const OrderCard = ({ order, index, isExpanded, onToggle }: {
  order: Order; index: number; isExpanded: boolean; onToggle: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.08 }}
    className="bg-white/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
  >
    <div className="p-5 flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-mineral/10 flex items-center justify-center flex-shrink-0">
          <Package className="w-6 h-6 text-mineral" />
        </div>
        <div>
          <h3 className="font-mono text-lg font-bold text-carbon">{order.order_number}</h3>
          <p className="text-sm text-carbon/50">{format(new Date(order.created_at), "d MMMM yyyy", { locale: fr })}</p>
        </div>
      </div>
      <StatusBadge status={order.status} />
      <div className="flex items-center gap-4 ml-auto">
        <div className="text-right">
          <p className="text-[10px] text-carbon/40 uppercase tracking-wide">Total TTC</p>
          <p className="text-xl font-bold text-carbon">{formatPrice(order.total_ttc)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle} className="hover:bg-mineral/10 rounded-xl">
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-5 h-5 text-carbon/60" />
          </motion.div>
        </Button>
      </div>
    </div>
    <AnimatePresence>
      {isExpanded && <OrderItemsDetails order={order} />}
    </AnimatePresence>
  </motion.div>
);

// Empty State
const EmptyOrderState = () => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-20 h-20 rounded-full bg-mineral/10 flex items-center justify-center mb-6">
      <ShoppingBag className="w-10 h-10 text-mineral/40" />
    </div>
    <h3 className="font-display text-xl text-carbon tracking-wide mb-2">AUCUNE COMMANDE</h3>
    <p className="text-carbon/50 max-w-sm mb-6 text-sm">Vous n'avez pas encore passé de commande. Explorez notre catalogue pour trouver les pièces parfaites pour votre machine.</p>
    <Button asChild className="bg-mineral hover:bg-mineral/90 text-white">
      <Link to="/catalogue">Découvrir le catalogue<ArrowRight className="w-4 h-4 ml-2" /></Link>
    </Button>
    <p className="mt-8 text-xs text-carbon/30 tracking-[0.2em] uppercase">ROULE · RÉPARE · DURE</p>
  </motion.div>
);

// Main
interface OrderHistorySectionProps { userId?: string; }

const OrderHistorySection = ({ userId }: OrderHistorySectionProps) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['user-orders', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!userId,
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-mineral" /></div>;
  if (!orders || orders.length === 0) return <EmptyOrderState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl text-carbon tracking-wide">HISTORIQUE COMMANDES</h2>
          <p className="text-sm text-carbon/50">{orders.length} commande{orders.length > 1 ? 's' : ''}</p>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs text-mineral/60 tracking-[0.15em] uppercase">ROULE · RÉPARE · DURE</span>
        </div>
      </div>
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {orders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              index={index}
              isExpanded={expandedOrderId === order.id}
              onToggle={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderHistorySection;
