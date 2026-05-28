import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, Tag, Building, Palette, GraduationCap, ScanLine, Package, MessageSquare, Ticket, Wallpaper, Paintbrush } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CompatibilityManager from './CompatibilityManager';
import CategoriesManager from './CategoriesManager';
import BrandsManager from './BrandsManager';
import OrdersManager from './OrdersManager';
import TutosManager from './TutosManager';
import ScansManager from './ScansManager';
import SiteDesignManager from './SiteDesignManager';
import ContactMessagesManager from './ContactMessagesManager';
import PromoCodesManager from './PromoCodesManager';
import GarageThemesManager from './GarageThemesManager';
import DesignGlobalManager from './DesignGlobalManager';
import GarageThemesManager from './GarageThemesManager';

const AdminSettings = () => {
  const [tab, setTab] = useState('orders');
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
  }, [tab]);

  const tabs = [
    { id: 'orders', label: 'Commandes', icon: Package },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'categories', label: 'Catégories', icon: Tag },
    { id: 'brands', label: 'Marques', icon: Building },
    { id: 'compatibility', label: 'Compat.', icon: Link2 },
    { id: 'design', label: 'Identité Site', icon: Palette },
    { id: 'design-global', label: 'Design Global', icon: Paintbrush },
    { id: 'garage-themes', label: 'Fonds Garage', icon: Wallpaper },
    { id: 'promos', label: 'Promos', icon: Ticket },
    { id: 'tutos', label: 'Tutos', icon: GraduationCap },
    { id: 'scans', label: 'Scans', icon: ScanLine },
  ];

  return (
    <div className="p-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-[hsl(0_0%_100%/0.05)] border border-[hsl(0_0%_18%)] p-1 h-auto flex-wrap gap-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[hsl(0_0%_55%)] px-3 py-2 gap-1.5 text-xs relative"
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {t.id === 'messages' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="orders" className="mt-4"><OrdersManager /></TabsContent>
        <TabsContent value="messages" className="mt-4"><ContactMessagesManager /></TabsContent>
        <TabsContent value="categories" className="mt-4"><CategoriesManager /></TabsContent>
        <TabsContent value="brands" className="mt-4"><BrandsManager /></TabsContent>
        <TabsContent value="compatibility" className="mt-4"><CompatibilityManager /></TabsContent>
        <TabsContent value="design" className="mt-4"><SiteDesignManager /></TabsContent>
        <TabsContent value="design-global" className="mt-4"><DesignGlobalManager /></TabsContent>
        <TabsContent value="garage-themes" className="mt-4"><GarageThemesManager /></TabsContent>
        <TabsContent value="promos" className="mt-4"><PromoCodesManager /></TabsContent>
        <TabsContent value="tutos" className="mt-4"><TutosManager /></TabsContent>
        <TabsContent value="scans" className="mt-4"><ScansManager /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
