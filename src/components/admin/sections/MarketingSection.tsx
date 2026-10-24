import { Ticket, ScanLine, Handshake, Newspaper, MessageCircleQuestion, Megaphone } from 'lucide-react';
import SectionTabs from './SectionTabs';
import PromoCodesManager from '../PromoCodesManager';
import ScansManager from '../ScansManager';
import AffiliateProgramsManager from '../AffiliateProgramsManager';
import BlogManager from '../BlogManager';
import RiderQuestionsManager from '../RiderQuestionsManager';
import AmbassadorsManager from '../AmbassadorsManager';

/** Marketing : promos et codes Rider, ambassadeurs créateurs (24/10/2026), affiliation + fournisseurs (23/10), blog (24/10), scans clients. */
const MarketingSection = () => (
  <SectionTabs
    title="Marketing"
    base="/admin/marketing"
    defaultTab="promos"
    tabs={[
      { id: 'promos', label: 'Codes promo', icon: Ticket, content: <PromoCodesManager /> },
      { id: 'ambassadeurs', label: 'Ambassadeurs', icon: Megaphone, content: <AmbassadorsManager /> },
      { id: 'affiliation', label: 'Affiliation', icon: Handshake, content: <AffiliateProgramsManager /> },
      { id: 'blog', label: 'Blog', icon: Newspaper, content: <BlogManager /> },
      { id: 'questions', label: 'Questions', icon: MessageCircleQuestion, content: <RiderQuestionsManager /> },
      { id: 'scans', label: 'Scans clients', icon: ScanLine, content: <ScansManager /> },
    ]}
  />
);

export default MarketingSection;
