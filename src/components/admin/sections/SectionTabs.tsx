import { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SectionTabDef {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  content: ReactNode;
}

interface SectionTabsProps {
  /** Base de la route, ex. /admin/catalogue — l'onglet actif vit dans l'URL (:sub) */
  base: string;
  defaultTab: string;
  tabs: SectionTabDef[];
  title: string;
}

/**
 * Onglets de section synchronisés avec la route : /admin/<section>/<sub>.
 * Le bouton retour du navigateur fonctionne donc à l'intérieur d'une section.
 * Sur téléphone, la liste défile horizontalement — aucun onglet n'est compressé.
 */
const SectionTabs = ({ base, defaultTab, tabs, title }: SectionTabsProps) => {
  const { sub } = useParams();
  const navigate = useNavigate();
  const value = tabs.some(t => t.id === sub) ? (sub as string) : defaultTab;

  return (
    <div className="p-3 md:p-5 space-y-3">
      <h1 className="font-display text-2xl tracking-wide text-[hsl(var(--admin-text))] px-1">{title.toUpperCase()}</h1>
      <Tabs value={value} onValueChange={v => navigate(`${base}/${v}`)}>
        <div className="-mx-3 px-3 md:mx-0 md:px-0 overflow-x-auto scrollbar-none">
          <TabsList className="inline-flex w-max min-w-full md:min-w-0 h-auto gap-1 p-1 bg-white border border-[hsl(var(--admin-border))] rounded-xl">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className={cn(
                    'gap-1.5 px-3 min-h-[40px] text-sm whitespace-nowrap rounded-lg',
                    'text-[hsl(var(--admin-text-muted))]',
                    'data-[state=active]:bg-[hsl(var(--admin-accent))] data-[state=active]:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                  {t.badge ? (
                    <Badge className="bg-orange-600 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center hover:bg-orange-600">
                      {t.badge}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        {tabs.map(t => (
          <TabsContent key={t.id} value={t.id} className="mt-3">
            {t.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default SectionTabs;
