import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Package, Eye, Loader2, ShoppingBag, ChevronDown, CheckCircle, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/formatPrice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import OrderDetailSheet from "./OrderDetailSheet";

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
};

// Status Configuration with LED Effect (15% opacity backgrounds)
const statusConfig: Record<string, { 
  label: string; 
  bgClass: string; 
  textClass: string;
  dotColor: string;
}> = {
  pending: { 
    label: "En attente", 
    bgClass: "bg-orange-500/15",
    textClass: "text-orange-500",
    dotColor: "bg-orange-500"
  },
  paid: { 
    label: "Payé", 
    bgClass: "bg-emerald-500/15",
    textClass: "text-emerald-500",
    dotColor: "bg-emerald-500"
  },
  processing: { 
    label: "En préparation", 
    bgClass: "bg-blue-500/15",
    textClass: "text-blue-500",
    dotColor: "bg-blue-500"
  },
  shipped: { 
    label: "Expédié", 
    bgClass: "bg-cyan-500/15",
    textClass: "text-cyan-500",
    dotColor: "bg-cyan-500"
  },
  delivered: { 
    label: "Livré", 
    bgClass: "bg-green-500/15",
    textClass: "text-green-500",
    dotColor: "bg-green-500"
  },
  cancelled: { 
    label: "Annulé", 
    bgClass: "bg-red-500/15",
    textClass: "text-red-500",
    dotColor: "bg-red-500"
  },
};

const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
  value,
  ...config,
}));

// Status Filter Bar Component
const StatusFilterBar = ({ 
  orders, 
  activeFilter, 
  onFilterChange 
}: { 
  orders: Order[] | undefined;
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}) => {
  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex items-center gap-2 text-muted-foreground mr-2">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">Filtrer</span>
      </div>
      
      {/* All Orders Button */}
      <button
        onClick={() => onFilterChange(null)}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
          "border border-white/10 backdrop-blur-sm",
          !activeFilter 
            ? "bg-foreground text-background" 
            : "bg-background/60 text-muted-foreground hover:bg-background/80"
        )}
      >
        Toutes ({orders?.length || 0})
      </button>

      {/* Status Filter Buttons with LED Effect */}
      {statusOptions.map((status) => {
        const count = orders?.filter(o => o.status === status.value).length || 0;
        const isActive = activeFilter === status.value;
        
        return (
          <button
            key={status.value}
            onClick={() => onFilterChange(status.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              "border border-white/10",
              isActive 
                ? `${status.bgClass} ${status.textClass}` 
                : "bg-background/60 text-muted-foreground hover:bg-background/80"
            )}
          >
            <span className="flex items-center gap-2">
              {isActive && <div className={cn("w-2 h-2 rounded-full", status.dotColor)} />}
              {status.label} ({count})
            </span>
          </button>
        );
      })}
    </div>
  );
};

// Status Dropdown Component with Monaco Design
const StatusDropdown = ({ 
  order, 
  onStatusChange, 
  isUpdating 
}: { 
  order: Order;
  onStatusChange: (orderId: string, newStatus: string) => void;
  isUpdating: boolean;
}) => {
  const currentStatus = statusConfig[order.status] || statusConfig.pending;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isUpdating}>
        <motion.div
          key={order.status}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 h-auto py-1.5 px-3 rounded-full",
              "border border-white/10 backdrop-blur-sm",
              currentStatus.bgClass,
              currentStatus.textClass,
              "hover:opacity-90 transition-all",
              isUpdating && "opacity-50 cursor-wait"
            )}
          >
            {isUpdating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <div className={cn("w-2 h-2 rounded-full", currentStatus.dotColor)} />
            )}
            <span className="text-xs font-medium">{currentStatus.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start"
        className="w-52 bg-background/95 backdrop-blur-xl border border-white/10 
                   shadow-xl rounded-xl p-1 z-50"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide px-2">
          Changer le statut
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        
        {statusOptions.map((status) => (
          <DropdownMenuItem
            key={status.value}
            onClick={() => onStatusChange(order.id, status.value)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
              "transition-all hover:bg-muted/50",
              order.status === status.value && "bg-muted/30"
            )}
          >
            {/* LED Badge Preview */}
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              status.bgClass,
              status.textClass,
              "border border-current/20"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", status.dotColor)} />
              {status.label}
            </div>
            
            {/* Checkmark if current */}
            {order.status === status.value && (
              <CheckCircle className="w-4 h-4 text-primary ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const OrdersManager = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    }
  });

  // Mutation with Optimistic Update
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      return { orderId, newStatus };
    },
    onMutate: async ({ orderId, newStatus }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['admin-orders'] });
      
      // Snapshot previous value
      const previousOrders = queryClient.getQueryData(['admin-orders']);
      
      // Optimistic update
      queryClient.setQueryData(['admin-orders'], (old: Order[] | undefined) => 
        old?.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      return { previousOrders };
    },
    onSuccess: (_, variables) => {
      // Invalidate both admin and user queries for immediate sync with /garage
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      
      const statusLabel = statusConfig[variables.newStatus]?.label || variables.newStatus;
      toast.success(`Statut mis à jour : ${statusLabel}`);
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(['admin-orders'], context.previousOrders);
      }
      toast.error("Erreur lors de la mise à jour du statut");
      console.error("Status update error:", error);
    },
    onSettled: () => {
      setUpdatingOrderId(null);
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    updateStatusMutation.mutate({ orderId, newStatus });
  };

  // Filter orders based on selected status
  const filteredOrders = statusFilter 
    ? orders?.filter(order => order.status === statusFilter)
    : orders;

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    queryClient.invalidateQueries({ queryKey: ['user-orders'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-primary/40" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Aucune commande
        </h3>
        <p className="text-muted-foreground">
          Les commandes apparaîtront ici une fois passées.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredOrders?.length || 0} commande{(filteredOrders?.length || 0) > 1 ? 's' : ''}
          {statusFilter && (
            <span className="ml-1">
              · <span className={statusConfig[statusFilter]?.textClass}>
                {statusConfig[statusFilter]?.label}
              </span>
            </span>
          )}
        </p>
      </div>

      {/* Status Filter Bar */}
      <StatusFilterBar 
        orders={orders}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Orders Table with Monaco borders */}
      <div className="rounded-xl border border-white/10 overflow-hidden bg-background/60 backdrop-blur-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-white/5">
              <TableHead className="text-foreground font-semibold">N° Commande</TableHead>
              <TableHead className="text-foreground font-semibold">Client</TableHead>
              <TableHead className="text-foreground font-semibold hidden md:table-cell">Email</TableHead>
              <TableHead className="text-foreground font-semibold hidden lg:table-cell">Date</TableHead>
              <TableHead className="text-foreground font-semibold text-right">Total TTC</TableHead>
              <TableHead className="text-foreground font-semibold">Statut</TableHead>
              <TableHead className="text-foreground font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filteredOrders?.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="hover:bg-muted/10 border-b border-white/5"
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-foreground">
                      {order.customer_first_name} {order.customer_last_name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {order.customer_email}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {format(new Date(order.created_at), "d MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">
                    {formatPrice(order.total_ttc)}
                  </TableCell>
                  <TableCell>
                    <StatusDropdown 
                      order={order}
                      onStatusChange={handleStatusChange}
                      isUpdating={updatingOrderId === order.id}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                      className="gap-2 hover:bg-primary/10 hover:text-primary"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Détails</span>
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Empty filtered state */}
      {filteredOrders?.length === 0 && orders.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">
            Aucune commande avec le statut "{statusConfig[statusFilter!]?.label}"
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter(null)}
            className="mt-2"
          >
            Voir toutes les commandes
          </Button>
        </motion.div>
      )}

      {/* Order Detail Sheet */}
      <OrderDetailSheet
        order={selectedOrder}
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default OrdersManager;
