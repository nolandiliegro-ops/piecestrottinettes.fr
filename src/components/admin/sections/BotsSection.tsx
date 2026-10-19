import { Bot, Bird, ScanLine, Wrench } from 'lucide-react';
import SectionTabs from './SectionTabs';
import PendingScootersManager, { usePendingScooters } from '../PendingScootersManager';
import PendingPartsManager, { usePendingParts } from '../PendingPartsManager';
import WatcherControl from '../WatcherControl';
import AdminScanner from '../AdminScanner';

/** Bots : tout ce qui alimente le catalogue automatiquement — imports, Veilleur, Scanner IA. */
const BotsSection = () => {
  const { data: pendingScooters = [] } = usePendingScooters();
  const { data: pendingParts = [] } = usePendingParts();

  return (
    <SectionTabs
      title="Bots"
      base="/admin/bots"
      defaultTab="import"
      tabs={[
        { id: 'import', label: 'Trott. à valider', icon: Bot, badge: pendingScooters.length, content: <PendingScootersManager /> },
        { id: 'pieces', label: 'Pièces à valider', icon: Wrench, badge: pendingParts.length, content: <PendingPartsManager /> },
        { id: 'veilleur', label: 'Le Veilleur', icon: Bird, content: <WatcherControl /> },
        { id: 'scanner', label: 'Scanner IA', icon: ScanLine, content: <AdminScanner /> },
      ]}
    />
  );
};

export default BotsSection;
