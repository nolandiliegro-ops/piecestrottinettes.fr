import { useState } from 'react';
import CompatStudio from '../CompatStudio';
import CompatibilityManager from '../CompatibilityManager';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

/** Onglet Compat : le Studio visuel par défaut, la vue classique (câblage par modèle) en secours. */
const CompatTab = () => {
  const [classic, setClassic] = useState(false);

  if (classic) {
    return (
      <div className="space-y-2">
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setClassic(false)}
            className="gap-2 bg-white border-[hsl(var(--admin-border))] min-h-[40px]"
          >
            <Sparkles className="w-4 h-4" /> Revenir au Studio
          </Button>
        </div>
        <CompatibilityManager />
      </div>
    );
  }
  return <CompatStudio onClassic={() => setClassic(true)} />;
};

export default CompatTab;
