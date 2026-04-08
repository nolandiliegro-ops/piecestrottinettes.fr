import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, Tag, Building, Palette, GraduationCap, ScanLine, Package } from 'lucide-react';
import { useState } from 'react';
import CompatibilityManager from './CompatibilityManager';
import CategoriesManager from './CategoriesManager';
import BrandsManager from './BrandsManager';
import OrdersManager from './OrdersManager';
import TutosManager from './TutosManager';
import ScansManager from './ScansManager';
import SiteDesignManager from './SiteDesignManager';

const AdminSettings = () => {
  const [tab, setTab] = useState('orders');

  const tabs = [
    { id: 'orders', label: 'Commandes', icon: Package },
    { id: 'categories', label: 'Catégories', icon: Tag },
    { id: 'brands', label: 'Marques', icon: Building },
    { id: 'compatibility', label: 'Compat.', icon: Link2 },
    { id: 'design', label: 'Design', icon: Palette },
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
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[hsl(0_0%_55%)] px-3 py-2 gap-1.5 text-xs"
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="orders" className="mt-4"><OrdersManager /></TabsContent>
        <TabsContent value="categories" className="mt-4"><CategoriesManager /></TabsContent>
        <TabsContent value="brands" className="mt-4"><BrandsManager /></TabsContent>
        <TabsContent value="compatibility" className="mt-4"><CompatibilityManager /></TabsContent>
        <TabsContent value="design" className="mt-4"><SiteDesignManager /></TabsContent>
        <TabsContent value="tutos" className="mt-4"><TutosManager /></TabsContent>
        <TabsContent value="scans" className="mt-4"><ScansManager /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
