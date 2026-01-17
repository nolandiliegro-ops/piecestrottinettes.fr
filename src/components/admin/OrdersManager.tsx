import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Package, Eye, Loader2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/formatPrice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { 
    label: "En attente", 
    className: "bg-orange-500/20 text-orange-400 border-orange-500/30" 
  },
  processing: { 
    label: "En préparation", 
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30" 
  },
  shipped: { 
    label: "Expédié", 
    className: "bg-mineral/20 text-mineral border-mineral/30" 
  },
  delivered: { 
    label: "Livré", 
    className: "bg-green-500/20 text-green-400 border-green-500/30" 
  },
  cancelled: { 
    label: "Annulé", 
    className: "bg-red-500/20 text-red-400 border-red-500/30" 
  },
};

const OrdersManager = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: orders, isLoading, refetch } = useQuery({
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

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusUpdate = () => {
    refetch();
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {orders.length} commande{orders.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="rounded-xl border border-border/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
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
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              
              return (
                <TableRow key={order.id} className="hover:bg-muted/10">
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
                    <Badge 
                      variant="outline" 
                      className={`${status.className} border`}
                    >
                      {status.label}
                    </Badge>
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

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
