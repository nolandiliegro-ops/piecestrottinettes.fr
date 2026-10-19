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
        // Les pièces non publiées sont surtout des dépublications volontaires (tri, archives) :
        // libellé honnête, pas de pastille d'alerte.
        { id: 'pieces', label: `Pièces dépubliées (${pendingParts.length})`, icon: Wrench, content: <PendingPartsManager /> },
        { id: 'veilleur', label: 'Le Veilleur', icon: Bird, content: <WatcherControl /> },
        { id: 'scanner', label: 'Scanner IA', icon: ScanLine, content: <AdminScanner /> },
      ]}
    />
  );
};

export default BotsSection;
