import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronDown, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/formatPrice';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// LED Effect Status Configuration
const statusConfig: Record<string, { 
  label: string; 
  bgClass: string; 
  textClass: string;
}> = {
  pending: { 
    label: "En attente", 
    bgClass: "bg-orange-500/15",
    textClass: "text-orange-600"
  },
  processing: { 
    label: "En préparation", 
    bgClass: "bg-blue-500/15",
    textClass: "text-blue-600"
  },
  shipped: { 
    label: "Expédié", 
    bgClass: "bg-mineral/15",
    textClass: "text-mineral"
  },
  delivered: { 
    label: "Livré", 
    bgClass: "bg-green-500/15",
    textClass: "text-green-600"
  },
  cancelled: { 
    label: "Annulé", 
    bgClass: "bg-red-500/15",
    textClass: "text-red-600"
  },
};

// Status Badge with LED Effect
const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <div className={cn(
      "px-4 py-1.5 rounded-full border border-current/20",
      config.bgClass,
      config.textClass
    )}>
      <span className="text-xs font-semibold tracking-wide uppercase">
        {config.label}
      </span>
    </div>
  );
};

// Order Items Details (Expandable)
const OrderItemsDetails = ({ orderId }: { orderId: string }) => {
  const { data: items, isLoading } = useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="px-5 pb-5 pt-3 border-t border-carbon/10">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-4 h-4 text-mineral" />
          <span className="text-xs font-medium text-carbon/70 tracking-wide uppercase">
            Articles commandés
          </span>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-mineral" />
          </div>
        ) : (
          <div className="space-y-2">
            {items?.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-3 bg-greige/50 rounded-xl border border-carbon/5"
              >
                {/* Item Image */}
                <div className="w-12 h-12 rounded-lg bg-white/80 overflow-hidden flex-shrink-0 border border-carbon/10">
                  {item.part_image_url ? (
                    <img 
                      src={item.part_image_url}
                      alt={item.part_name}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-carbon/30" />
                    </div>
                  )}
                </div>
                
                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-carbon text-sm truncate">
                    {item.part_name}
                  </p>
                  <p className="text-xs text-carbon/50">
                    {formatPrice(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                
                {/* Line Total */}
                <span className="font-bold text-mineral text-sm">
                  {formatPrice(item.line_total)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Branding Footer */}
        <div className="mt-4 pt-3 border-t border-carbon/5 text-center relative">
          {/* Watermark Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[40px] font-display text-carbon/[0.03] tracking-[0.2em] uppercase whitespace-nowrap">
              ROULE RÉPARE DURE
            </span>
          </div>
          <span className="relative text-[10px] text-carbon/30 tracking-[0.25em] uppercase">
            PIÈCES TROTTINETTES · ROULE RÉPARE DURE
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Order Card Component
interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_ttc: number;
  subtotal_ht: number;
  tva_amount: number;
}

interface OrderCardProps {
  order: Order;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const OrderCard = ({ order, index, isExpanded, onToggle }: OrderCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="bg-white/60 backdrop-blur-md border border-white/10 rounded-2xl 
                 overflow-hidden shadow-sm hover:shadow-lg transition-all"
    >
      {/* Main Card Content */}
      <div className="p-5 flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
        {/* Left: Order Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-mineral/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-mineral" />
          </div>
          
          <div>
            <h3 className="font-mono text-lg font-bold text-carbon">
              {order.order_number}
            </h3>
            <p className="text-sm text-carbon/50">
              {format(new Date(order.created_at), "d MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>
        
        {/* Center: Status Badge */}
        <StatusBadge status={order.status} />
        
        {/* Right: Total + Expand Button */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="text-right">
            <p className="text-[10px] text-carbon/40 uppercase tracking-wide">Total TTC</p>
            <p className="text-xl font-bold text-carbon">
              {formatPrice(order.total_ttc)}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="hover:bg-mineral/10 rounded-xl"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-carbon/60" />
            </motion.div>
          </Button>
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {isExpanded && <OrderItemsDetails orderId={order.id} />}
      </AnimatePresence>
    </motion.div>
  );
};

// Empty State Component
const EmptyOrderState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <div className="w-20 h-20 rounded-full bg-mineral/10 flex items-center justify-center mb-6">
      <ShoppingBag className="w-10 h-10 text-mineral/40" />
    </div>
    
    <h3 className="font-display text-xl text-carbon tracking-wide mb-2">
      AUCUNE COMMANDE
    </h3>
    
    <p className="text-carbon/50 max-w-sm mb-6 text-sm">
      Vous n'avez pas encore passé de commande. 
      Explorez notre catalogue pour trouver les pièces parfaites pour votre machine.
    </p>
    
    <Button asChild className="bg-mineral hover:bg-mineral/90 text-white">
      <Link to="/catalogue">
        Découvrir le catalogue
        <ArrowRight className="w-4 h-4 ml-2" />
      </Link>
    </Button>
    
    <p className="mt-8 text-xs text-carbon/30 tracking-[0.2em] uppercase">
      ROULE · RÉPARE · DURE
    </p>
  </motion.div>
);

// Main Component
interface OrderHistorySectionProps {
  userId?: string;
}

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-mineral" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return <EmptyOrderState />;
  }

  return (
    <div className="space-y-4">
      {/* Header with branding */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl text-carbon tracking-wide">
            HISTORIQUE COMMANDES
          </h2>
          <p className="text-sm text-carbon/50">
            {orders.length} commande{orders.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="text-right hidden sm:block">
          <span className="text-xs text-mineral/60 tracking-[0.15em] uppercase">
            ROULE · RÉPARE · DURE
          </span>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {orders.map((order, index) => (
            <OrderCard 
              key={order.id}
              order={order}
              index={index}
              isExpanded={expandedOrderId === order.id}
              onToggle={() => setExpandedOrderId(
                expandedOrderId === order.id ? null : order.id
              )}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderHistorySection;
