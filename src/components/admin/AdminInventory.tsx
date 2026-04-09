import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, Bike, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PartsManager from './PartsManager';
import ScootersManager from './ScootersManager';
import PendingScootersManager, { usePendingScooters } from './PendingScootersManager';

const AdminInventory = () => {
  const [tab, setTab] = useState('parts');
  const { data: pending = [] } = usePendingScooters();

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
            value="pending"
            className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[hsl(0_0%_55%)] gap-2 relative"
          >
            <Bot className="w-4 h-4" />
            Bot Import
            {pending.length > 0 && (
              <Badge className="ml-1 bg-violet-600 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parts" className="mt-4">
          <PartsManager />
        </TabsContent>
        <TabsContent value="scooters" className="mt-4">
          <ScootersManager />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <PendingScootersManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminInventory;
