import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, Bike, Bot, Bird, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PartsManager from './PartsManager';
import ScootersManager from './ScootersManager';
import BrandsManager from './BrandsManager';
import PendingScootersManager, { usePendingScooters } from './PendingScootersManager';
import PendingPartsManager, { usePendingParts } from './PendingPartsManager';
import WatcherControl from './WatcherControl';

const AdminInventory = () => {
  const [tab, setTab] = useState('parts');
  const { data: pendingScooters = [] } = usePendingScooters();
  const { data: pendingParts = [] } = usePendingParts();

  return (
    <div className="p-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-[hsl(0_0%_100%/0.05)] border border-[hsl(0_0%_18%)] p-1">
          <TabsTrigger 
            value="parts" 
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[hsl(0_0%_55%)] gap-2"
          >
            <Wrench className="w-4 h-4" />
            Pièces
          </TabsTrigger>
          <TabsTrigger 
            value="scooters"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[hsl(0_0%_55%)] gap-2"
          >
            <Bike className="w-4 h-4" />
            Trottinettes
          </TabsTrigger>
          <TabsTrigger 
            value="brands"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[hsl(0_0%_55%)] gap-2"
          >
            <Tag className="w-4 h-4" />
            Marques
          </TabsTrigger>
          <TabsTrigger 
            value="pending"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[hsl(0_0%_55%)] gap-2 relative"
          >
            <Bot className="w-4 h-4" />
            Bot Import
            {pendingScooters.length > 0 && (
              <Badge className="ml-1 bg-violet-600 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                {pendingScooters.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="pending-parts"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[hsl(0_0%_55%)] gap-2 relative"
          >
            <Bot className="w-4 h-4" />
            Pièces Bot
            {pendingParts.length > 0 && (
              <Badge className="ml-1 bg-violet-600 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                {pendingParts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="watcher"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[hsl(0_0%_55%)] gap-2"
          >
            <Bird className="w-4 h-4" />
            Le Veilleur
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parts" className="mt-4">
          <PartsManager />
        </TabsContent>
        <TabsContent value="scooters" className="mt-4">
          <ScootersManager />
        </TabsContent>
        <TabsContent value="brands" className="mt-4">
          <BrandsManager />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <PendingScootersManager />
        </TabsContent>
        <TabsContent value="pending-parts" className="mt-4">
          <PendingPartsManager />
        </TabsContent>
        <TabsContent value="watcher" className="mt-4">
          <WatcherControl />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminInventory;
