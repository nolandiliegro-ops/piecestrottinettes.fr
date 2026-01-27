import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  User, 
  MapPin, 
  Package, 
  Loader2, 
  Gem,
  Truck,
  Zap,
  MapPin as MapPinIcon,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/formatPrice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type Order = {
  id: string;
  order_number: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string | null;
  address: string;
  postal_code: string;
  city: string;
  subtotal_ht: number;
  tva_amount: number;
  total_ttc: number;
  loyalty_points_earned: number;
  status: string;
  created_at: string;
  delivery_method: string | null;
  delivery_price: number | null;
  notes: string | null;
};

type OrderItem = {
  id: string;
  part_name: string;
  part_image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

interface OrderDetailSheetProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}

const statusOptions = [
  { value: "pending", label: "En attente", color: "bg-orange-500" },
  { value: "processing", label: "En préparation", color: "bg-blue-500" },
  { value: "shipped", label: "Expédié", color: "bg-mineral" },
  { value: "delivered", label: "Livré", color: "bg-green-500" },
  { value: "cancelled", label: "Annulé", color: "bg-red-500" },
];

// Delivery method configuration with Studio design (bg-500/15 + text-500)
const deliveryMethodConfig: Record<string, { 
  label: string; 
  colorClass: string;
  bgClass: string;
  Icon: React.ElementType;
}> = {
  standard: { 
    label: "Standard (3-5j)", 
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/15",
    Icon: Package
  },
  express: { 
    label: "Express (24-48h)", 
    colorClass: "text-orange-500",
    bgClass: "bg-orange-500/15",
    Icon: Zap
  },
  relay: { 
    label: "Point Relais", 
    colorClass: "text-green-500",
    bgClass: "bg-green-500/15",
    Icon: MapPinIcon
  },
};

const OrderDetailSheet = ({ order, isOpen, onClose, onStatusUpdate }: OrderDetailSheetProps) => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch order items
  const { data: orderItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['order-items', order?.id],
    queryFn: async () => {
      if (!order?.id) return [];
      
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!order?.id,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!order?.id) return;
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      onStatusUpdate();
      toast.success("Statut mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    await updateStatusMutation.mutateAsync(newStatus);
    setIsUpdating(false);
  };

  if (!order) return null;

  const currentStatus = statusOptions.find(s => s.value === order.status) || statusOptions[0];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border/30 overflow-hidden">
        <SheetHeader className="pb-4 border-b border-border/20">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-foreground">Commande</span>
                <span className="font-mono text-primary ml-2">{order.order_number}</span>
              </div>
            </SheetTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Passée le {format(new Date(order.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] w-full">
          <div className="space-y-6 py-6 pr-6">
            {/* Status Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Statut</label>
              <Select
                value={order.status}
                onValueChange={handleStatusChange}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full bg-background/50">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${currentStatus.color}`} />
                      {currentStatus.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="w-4 h-4 text-primary" />
                Informations client
              </div>
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <p className="font-medium text-foreground">
                  {order.customer_first_name} {order.customer_last_name}
                </p>
                <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                {order.customer_phone && (
                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                Adresse de livraison
              </div>
              <div className="bg-muted/30 rounded-xl p-4 space-y-1">
                <p className="text-foreground">{order.address}</p>
                <p className="text-muted-foreground">
                  {order.postal_code} {order.city}
                </p>
              </div>
            </div>

            {/* Delivery Info - Conditional */}
            {order.delivery_method && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Truck className="w-4 h-4 text-primary" />
                  Livraison
                </div>
                <div className="bg-mineral/10 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    {(() => {
                      const config = deliveryMethodConfig[order.delivery_method];
                      const IconComponent = config?.Icon || Package;
                      return (
                        <div className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                          config?.bgClass || "bg-muted",
                          config?.colorClass || "text-foreground"
                        )}>
                          <IconComponent className="w-4 h-4" />
                          {config?.label || order.delivery_method}
                        </div>
                      );
                    })()}
                    {order.delivery_price !== null && order.delivery_price > 0 && (
                      <span className="font-semibold text-foreground">
                        {formatPrice(order.delivery_price)}
                      </span>
                    )}
                    {order.delivery_price === 0 && (
                      <span className="text-green-500 font-medium">Gratuit</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Customer Notes - Conditional */}
            {order.notes && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Notes du client
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm text-foreground italic">
                    "{order.notes}"
                  </p>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Package className="w-4 h-4 text-primary" />
                Articles commandés
              </div>
              
              {itemsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : orderItems && orderItems.length > 0 ? (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center gap-4 bg-muted/30 rounded-xl p-3"
                    >
                      {/* Item Image */}
                      <div className="w-16 h-16 rounded-lg bg-background/50 overflow-hidden flex-shrink-0">
                        {item.part_image_url ? (
                          <img 
                            src={item.part_image_url} 
                            alt={item.part_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {item.part_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.unit_price)} × {item.quantity}
                        </p>
                      </div>
                      
                      {/* Line Total */}
                      <span className="font-semibold text-foreground">
                        {formatPrice(item.line_total)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun article trouvé
                </p>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-3 pt-4 border-t border-border/20 w-full">
              <div className="flex justify-between items-center text-sm w-full">
                <span className="text-muted-foreground flex-shrink-0">Sous-total HT</span>
                <span className="text-foreground font-medium text-right flex-shrink-0">
                  {formatPrice(order.subtotal_ht)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm w-full">
                <span className="text-muted-foreground flex-shrink-0">TVA (20%)</span>
                <span className="text-foreground font-medium text-right flex-shrink-0">
                  {formatPrice(order.tva_amount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm w-full">
                <span className="text-muted-foreground flex-shrink-0">
                  Livraison {order.delivery_method ? `(${deliveryMethodConfig[order.delivery_method]?.label || order.delivery_method})` : ''}
                </span>
                <span className="text-foreground font-medium text-right flex-shrink-0">
                  {order.delivery_price && order.delivery_price > 0 
                    ? formatPrice(order.delivery_price) 
                    : order.delivery_price === 0 
                      ? <span className="text-green-500">Gratuit</span>
                      : '—'}
                </span>
              </div>
              <div className="h-px bg-border/30 my-2" />
              <div className="flex justify-between items-baseline w-full">
                <span className="font-semibold text-foreground flex-shrink-0">Total TTC</span>
                <span className="text-2xl font-bold text-primary flex-shrink-0">
                  {formatPrice(order.total_ttc)}
                </span>
              </div>
              
              {/* Loyalty Points */}
              {order.loyalty_points_earned > 0 && (
                <div className="flex items-center justify-center gap-2 py-2 px-3 bg-primary/10 rounded-xl mt-4">
                  <Gem className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {order.loyalty_points_earned} points gagnés
                  </span>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailSheet;
