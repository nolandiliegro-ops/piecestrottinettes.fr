import { Image, Palette, Paintbrush, Wallpaper, GraduationCap, Scissors, Sparkles } from 'lucide-react';
import SectionTabs from './SectionTabs';
import BrandAssetsManager from '../BrandAssetsManager';
import SiteDesignManager from '../SiteDesignManager';
import DesignGlobalManager from '../DesignGlobalManager';
import GarageThemesManager from '../GarageThemesManager';
import TutosManager from '../TutosManager';
import BackgroundRemovalManager from '../BackgroundRemovalManager';
import HomeBridgeManager from '../HomeBridgeManager';

/** Site : identité visuelle, design tokens, contenus éditoriaux. */
const SiteSection = () => (
  <SectionTabs
    title="Site"
    base="/admin/site"
    defaultTab="logo"
    tabs={[
      { id: 'logo', label: 'Logo & assets', icon: Image, content: <BrandAssetsManager /> },
      { id: 'identite', label: 'Identité', icon: Palette, content: <SiteDesignManager /> },
      { id: 'design', label: 'Design Global', icon: Paintbrush, content: <DesignGlobalManager /> },
      { id: 'bridge', label: 'Pont accueil', icon: Sparkles, content: <HomeBridgeManager /> },
      { id: 'fonds', label: 'Fonds Garage', icon: Wallpaper, content: <GarageThemesManager /> },
      { id: 'tutos', label: 'Tutos', icon: GraduationCap, content: <TutosManager /> },
      { id: 'detourage', label: 'Détourage', icon: Scissors, content: <BackgroundRemovalManager /> },
    ]}
  />
);

export default SiteSection;
