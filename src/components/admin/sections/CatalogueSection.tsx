import { Wrench, Bike, Tag, FolderTree, Link2, Layers } from 'lucide-react';
import SectionTabs from './SectionTabs';
import PartsManager from '../PartsManager';
import ScootersManager from '../ScootersManager';
import BrandsManager from '../BrandsManager';
import CategoriesManager from '../CategoriesManager';
import CompatTab from './CompatTab';
import CatalogueTriage from '../CatalogueTriage';

/** Catalogue : tout ce qui décrit les produits. Les bots d'import vivent dans /admin/bots. */
const CatalogueSection = () => (
  <SectionTabs
    title="Catalogue"
    base="/admin/catalogue"
    defaultTab="pieces"
    tabs={[
      { id: 'pieces', label: 'Pièces', icon: Wrench, content: <PartsManager /> },
      { id: 'trottinettes', label: 'Trottinettes', icon: Bike, content: <ScootersManager /> },
      { id: 'marques', label: 'Marques', icon: Tag, content: <BrandsManager /> },
      { id: 'categories', label: 'Catégories', icon: FolderTree, content: <CategoriesManager /> },
      { id: 'compat', label: 'Compatibilités', icon: Link2, content: <CompatTab /> },
      { id: 'tri', label: 'Tri', icon: Layers, content: <CatalogueTriage /> },
    ]}
  />
);

export default CatalogueSection;
