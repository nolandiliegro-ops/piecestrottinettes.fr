import { Ticket, ScanLine, Handshake, Newspaper, MessageCircleQuestion } from 'lucide-react';
import SectionTabs from './SectionTabs';
import PromoCodesManager from '../PromoCodesManager';
import ScansManager from '../ScansManager';
import AffiliateProgramsManager from '../AffiliateProgramsManager';
import AffiliationCockpit from '../affiliation/AffiliationCockpit';
import { useSearchParams } from 'react-router-dom';
import BlogManager from '../BlogManager';
import RiderQuestionsManager from '../RiderQuestionsManager';

/** 24/10/2026 — Affiliation v2 « Cockpit » par défaut ; l'ancien écran reste joignable par ?aff=0 le temps de la recette. */
const AffiliationTab = () => {
  const [params] = useSearchParams();
  return params.get('aff') === '0' ? <AffiliateProgramsManager /> : <AffiliationCockpit />;
};

/** Marketing : promos et codes Rider, affiliation + fournisseurs (23/10/2026), blog (24/10), scans clients. */
const MarketingSection = () => (
  <SectionTabs
    title="Marketing"
    base="/admin/marketing"
    defaultTab="promos"
    tabs={[
      { id: 'promos', label: 'Codes promo', icon: Ticket, content: <PromoCodesManager /> },
      { id: 'affiliation', label: 'Affiliation', icon: Handshake, content: <AffiliationTab /> },
      { id: 'blog', label: 'Blog', icon: Newspaper, content: <BlogManager /> },
      { id: 'questions', label: 'Questions', icon: MessageCircleQuestion, content: <RiderQuestionsManager /> },
      { id: 'scans', label: 'Scans clients', icon: ScanLine, content: <ScansManager /> },
    ]}
  />
);

export default MarketingSection;
