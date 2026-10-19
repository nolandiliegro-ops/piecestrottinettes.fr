import { Ticket, ScanLine } from 'lucide-react';
import SectionTabs from './SectionTabs';
import PromoCodesManager from '../PromoCodesManager';
import ScansManager from '../ScansManager';

/** Marketing : promos et codes Rider aujourd'hui ; affiliation et campagnes demain. */
const MarketingSection = () => (
  <SectionTabs
    title="Marketing"
    base="/admin/marketing"
    defaultTab="promos"
    tabs={[
      { id: 'promos', label: 'Codes promo', icon: Ticket, content: <PromoCodesManager /> },
      { id: 'scans', label: 'Scans clients', icon: ScanLine, content: <ScansManager /> },
    ]}
  />
);

export default MarketingSection;
