import { Store, ExternalLink, Rocket } from 'lucide-react';
import { SHOP_OPEN } from '@/config/launch';
import { Badge } from '@/components/ui/badge';

/**
 * Réglages : l'état des interrupteurs globaux du site.
 * SHOP_OPEN est une constante de build (src/config/launch.ts) doublée d'un secret
 * serveur — il se change par commit + publication, pas depuis cet écran.
 */
const ReglagesSection = () => (
  <div className="p-3 md:p-5 space-y-3">
    <h1 className="font-display text-2xl tracking-wide text-[hsl(var(--admin-text))] px-1">RÉGLAGES</h1>

    <div className="admin-glass-card rounded-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[hsl(var(--admin-accent)/0.12)] flex items-center justify-center shrink-0">
        <Store className="w-5 h-5 text-[hsl(var(--admin-accent))]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-[hsl(var(--admin-text))]">Boutique</p>
          {SHOP_OPEN ? (
            <Badge className="bg-[hsl(var(--admin-accent))] text-white hover:bg-[hsl(var(--admin-accent))]">Ouverte</Badge>
          ) : (
            <Badge className="bg-orange-600 text-white hover:bg-orange-600">Pré-lancement — shop fermé</Badge>
          )}
        </div>
        <p className="text-sm text-[hsl(var(--admin-text-muted))] mt-1">
          L'ouverture se fait par commit (<code className="text-xs">src/config/launch.ts</code>) + secret serveur
          <code className="text-xs"> SHOP_OPEN</code>, puis publication. Prévu le 30/10/2026.
        </p>
      </div>
      <Rocket className="w-5 h-5 text-[hsl(var(--admin-text-muted))] shrink-0" />
    </div>

    <div className="admin-glass-card rounded-2xl p-4">
      <p className="font-semibold text-[hsl(var(--admin-text))] mb-2">Liens rapides</p>
      <div className="flex flex-col gap-1">
        {[
          { label: 'Le site en ligne', href: '/' },
          { label: 'Catalogue public', href: '/catalogue' },
          { label: 'Garage', href: '/garage' },
        ].map(l => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 min-h-[44px] px-2 rounded-lg text-sm text-[hsl(var(--admin-text-muted))] hover:bg-[hsl(var(--aov04))] hover:text-[hsl(var(--admin-text))]"
          >
            <ExternalLink className="w-4 h-4" /> {l.label}
          </a>
        ))}
      </div>
    </div>
  </div>
);

export default ReglagesSection;
