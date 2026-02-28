import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Package, Bike, ShoppingBag, AlertTriangle, TrendingUp, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalParts: number;
  totalScooters: number;
  totalOrders: number;
  lowStockCount: number;
  recentOrders: { id: string; order_number: string; total_ttc: number; status: string; created_at: string }[];
}

const StatSkeleton = () => (
  <div className="admin-glass-card rounded-2xl p-5">
    <div className="admin-skeleton h-4 w-20 rounded mb-3" />
    <div className="admin-skeleton h-8 w-16 rounded mb-2" />
    <div className="admin-skeleton h-3 w-24 rounded" />
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [partsRes, scootersRes, ordersRes, lowStockRes, recentOrdersRes] = await Promise.all([
          supabase.from('parts').select('id', { count: 'exact', head: true }),
          supabase.from('scooter_models').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('parts').select('id', { count: 'exact', head: true }).lt('stock_quantity', 5),
          supabase.from('orders').select('id, order_number, total_ttc, status, created_at').order('created_at', { ascending: false }).limit(5),
        ]);

        setStats({
          totalParts: partsRes.count || 0,
          totalScooters: scootersRes.count || 0,
          totalOrders: ordersRes.count || 0,
          lowStockCount: lowStockRes.count || 0,
          recentOrders: recentOrdersRes.data || [],
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Pièces', value: stats?.totalParts, icon: Package, color: 'text-primary' },
    { label: 'Trottinettes', value: stats?.totalScooters, icon: Bike, color: 'text-blue-400' },
    { label: 'Commandes', value: stats?.totalOrders, icon: ShoppingBag, color: 'text-amber-400' },
    { label: 'Stock Bas', value: stats?.lowStockCount, icon: AlertTriangle, color: 'text-destructive' },
  ];

  const statusLabel: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-amber-500/20 text-amber-400' },
    paid: { label: 'Payé', color: 'bg-primary/20 text-primary' },
    shipped: { label: 'Expédié', color: 'bg-blue-500/20 text-blue-400' },
    delivered: { label: 'Livré', color: 'bg-green-500/20 text-green-400' },
  };

  return (
    <div className="p-4 space-y-4">
      {/* Stats Grid - Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading ? (
          <>
            <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
          </>
        ) : (
          statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="admin-glass-card rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("w-4 h-4", card.color)} />
                  <span className="text-xs text-[hsl(0_0%_55%)]">{card.label}</span>
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Recent Orders */}
      <div className="admin-glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Commandes récentes</h2>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="admin-skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : stats?.recentOrders.length === 0 ? (
          <p className="text-sm text-[hsl(0_0%_55%)] text-center py-6">Aucune commande</p>
        ) : (
          <div className="space-y-2">
            {stats?.recentOrders.map((order) => {
              const status = statusLabel[order.status] || { label: order.status, color: 'bg-muted text-muted-foreground' };
              return (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-[hsl(0_0%_100%/0.03)] hover:bg-[hsl(0_0%_100%/0.06)] transition-colors">
                  <div>
                    <p className="text-sm font-medium">#{order.order_number}</p>
                    <p className="text-xs text-[hsl(0_0%_55%)]">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", status.color)}>
                      {status.label}
                    </span>
                    <span className="text-sm font-bold">{order.total_ttc.toFixed(2)}€</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
