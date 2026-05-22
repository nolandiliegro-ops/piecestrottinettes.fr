import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Package, Users, ScanLine, MessageSquare, Settings, ArrowLeft, Shield, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'inventory', icon: Package, label: 'Inventaire' },
  { id: 'clients', icon: Users, label: 'Clients' },
  { id: 'scanner', icon: ScanLine, label: 'Scanner' },
  { id: 'messages', icon: MessageSquare, label: 'Messages' },
  { id: 'brand', icon: Palette, label: 'Identité Site' },
  { id: 'settings', icon: Settings, label: 'Réglages' },
];

const AdminLayout = ({ children, activeTab, onTabChange }: AdminLayoutProps) => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('conversation_status')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
  }, [activeTab]);

  return (
    <div className="admin-studio min-h-screen bg-[hsl(0_0%_10%)] text-[hsl(0_0%_95%)] flex flex-col">
      {/* Top Header - Compact */}
      <header className="sticky top-0 z-50 admin-glass-card border-b border-[hsl(0_0%_18%)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg hover:bg-[hsl(0_0%_100%/0.05)] transition-colors">
              <ArrowLeft className="w-5 h-5 text-[hsl(0_0%_55%)]" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight">Admin Studio</h1>
                <p className="text-[10px] text-[hsl(0_0%_55%)]">Panneau de contrôle</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 admin-glass-card border-t border-[hsl(0_0%_18%)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center",
                  "min-w-0 min-h-[48px] px-2 py-2",
                  "rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10"
                )}
              >
                <div className="relative">
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-colors duration-200",
                      isActive ? "text-primary" : "text-[hsl(0_0%_55%)]"
                    )}
                  />
                  {item.id === 'messages' && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium mt-1 transition-colors duration-200",
                  isActive ? "text-primary" : "text-[hsl(0_0%_55%)]"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="admin-nav-indicator"
                    className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;
