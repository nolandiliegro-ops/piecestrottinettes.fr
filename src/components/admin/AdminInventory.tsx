import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, Bike } from 'lucide-react';
import PartsManager from './PartsManager';
import ScootersManager from './ScootersManager';

const AdminInventory = () => {
  const [tab, setTab] = useState('parts');

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
        </TabsList>

        <TabsContent value="parts" className="mt-4">
          <PartsManager />
        </TabsContent>
        <TabsContent value="scooters" className="mt-4">
          <ScootersManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminInventory;
