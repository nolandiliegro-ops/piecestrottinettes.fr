import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Package, Bot, Users, MessageSquare,
  Ticket, Palette, Settings, ArrowLeft, ChevronLeft, ChevronRight,
  MoreHorizontal, ExternalLink, Store, ScanBarcode,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAdminBadges } from '@/hooks/useAdminBadges';

interface AdminLayoutProps {
  children: React.ReactNode;
}

type BadgeKey = 'orders' | 'messages' | 'bots';

interface NavItem {
  to: string;
  end?: boolean;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: BadgeKey;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', end: true, label: 'Accueil', icon: LayoutDashboard },
  { to: '/admin/commandes', label: 'Commandes', icon: ShoppingBag, badge: 'orders' },
  { to: '/admin/catalogue', label: 'Catalogue', icon: Package },
  { to: '/admin/stock', label: 'Stock', icon: ScanBarcode },
  { to: '/admin/bots', label: 'Bots', icon: Bot, badge: 'bots' },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/pros', label: 'Pros', icon: Store },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare, badge: 'messages' },
  { to: '/admin/marketing', label: 'Marketing', icon: Ticket },
  { to: '/admin/site', label: 'Site', icon: Palette },
  { to: '/admin/reglages', label: 'Réglages', icon: Settings },
];

/** Les 4 destinations fréquentes de la barre basse téléphone ; le reste vit dans « Plus ». */
const MOBILE_MAIN = ['/admin', '/admin/commandes', '/admin/catalogue', '/admin/messages'];

const CountBadge = ({ count, className }: { count: number; className?: string }) => {
  if (!count) return null;
  return (
    <span className={cn(
      'min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full',
      'bg-orange-600 text-white text-[10px] font-bold leading-none',
      className
    )}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const badges = useAdminBadges();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('pt-admin-sidebar') === '1'; } catch { return false; }
  });
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('pt-admin-sidebar', collapsed ? '1' : '0'); } catch { /* noop */ }
  }, [collapsed]);

  // Ferme la feuille « Plus » à chaque navigation
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  const badgeFor = (key?: BadgeKey) =>
    key === 'orders' ? badges.ordersToProcess
    : key === 'messages' ? badges.pendingMessages
    : key === 'bots' ? badges.pendingImports
    : 0;

  const mainItems = NAV_ITEMS.filter(i => MOBILE_MAIN.includes(i.to));
  const moreItems = NAV_ITEMS.filter(i => !MOBILE_MAIN.includes(i.to));
  const moreHasBadge = moreItems.some(i => badgeFor(i.badge) > 0);

  return (
    <div className="admin-studio min-h-screen flex flex-col md:flex-row">
      {/* ===== Sidebar desktop / iPad ===== */}
      <aside className={cn(
        'hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 z-40',
        'bg-white border-r border-[hsl(var(--admin-border))] transition-all duration-200',
        collapsed ? 'md:w-16' : 'md:w-60'
      )}>
        <div className={cn('flex items-center gap-2 px-3 h-16 border-b border-[hsl(var(--admin-border))]', collapsed && 'justify-center px-0')}>
          <img src="/brand/icone-pt.svg" alt="pt" className="w-9 h-9 rounded-lg shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display text-lg leading-none tracking-wide text-[hsl(var(--admin-text))]">ADMIN</p>
              <p className="text-[11px] text-[hsl(var(--admin-text-muted))] truncate">piecestrottinettes.fr</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const count = badgeFor(item.badge);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 rounded-xl px-3 min-h-[44px] text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-[hsl(var(--admin-accent)/0.12)] text-[hsl(var(--admin-accent))]'
                    : 'text-[hsl(var(--admin-text-muted))] hover:bg-[hsl(var(--aov04))] hover:text-[hsl(var(--admin-text))]'
                )}
              >
                <span className="relative shrink-0">
                  <Icon className="w-5 h-5" />
                  {collapsed && <CountBadge count={count} className="absolute -top-2 -right-2" />}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    <CountBadge count={count} />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-2 border-t border-[hsl(var(--admin-border))] space-y-1">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            title="Voir le site"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 min-h-[44px] text-sm font-medium',
              'text-[hsl(var(--admin-text-muted))] hover:bg-[hsl(var(--aov04))] hover:text-[hsl(var(--admin-text))]',
              collapsed && 'justify-center px-0'
            )}
          >
            <ExternalLink className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Voir le site</span>}
          </a>
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Déplier' : 'Replier'}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-3 min-h-[44px] text-sm font-medium',
              'text-[hsl(var(--admin-text-muted))] hover:bg-[hsl(var(--aov04))] hover:text-[hsl(var(--admin-text))]',
              collapsed && 'justify-center px-0'
            )}
          >
            {collapsed ? <ChevronRight className="w-5 h-5 shrink-0" /> : <ChevronLeft className="w-5 h-5 shrink-0" />}
            {!collapsed && <span>Replier</span>}
          </button>
        </div>
      </aside>

      {/* ===== Colonne contenu ===== */}
      <div className={cn('flex-1 flex flex-col min-w-0 transition-all duration-200', collapsed ? 'md:pl-16' : 'md:pl-60')}>
        {/* Header mobile */}
        <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[hsl(var(--admin-border))]">
          <div className="flex items-center justify-between px-3 h-14">
            <div className="flex items-center gap-2">
              <Link to="/" className="p-2 -ml-1 rounded-lg hover:bg-[hsl(var(--aov04))]" aria-label="Retour au site">
                <ArrowLeft className="w-5 h-5 text-[hsl(var(--admin-text-muted))]" />
              </Link>
              <img src="/brand/icone-pt.svg" alt="pt" className="w-7 h-7 rounded-md" />
              <span className="font-display text-base tracking-wide">ADMIN</span>
            </div>
            <a href="/" target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-[hsl(var(--aov04))]" aria-label="Voir le site">
              <ExternalLink className="w-5 h-5 text-[hsl(var(--admin-text-muted))]" />
            </a>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* ===== Bottom nav téléphone : 4 destinations + Plus ===== */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-[hsl(var(--admin-border))]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}
      >
        <div className="flex items-stretch justify-around px-1 pt-1">
          {mainItems.map(item => {
            const Icon = item.icon;
            const count = badgeFor(item.badge);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn(
                  'flex flex-col items-center justify-center flex-1 min-h-[52px] rounded-xl py-1.5 transition-colors',
                  isActive ? 'text-[hsl(var(--admin-accent))]' : 'text-[hsl(var(--admin-text-muted))]'
                )}
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <Icon className="w-5 h-5" />
                      <CountBadge count={count} className="absolute -top-1.5 -right-3.5" />
                    </span>
                    <span className={cn('text-[11px] mt-0.5 font-medium', isActive && 'font-semibold')}>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center flex-1 min-h-[52px] rounded-xl py-1.5 text-[hsl(var(--admin-text-muted))]">
                <span className="relative">
                  <MoreHorizontal className="w-5 h-5" />
                  {moreHasBadge && <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-orange-600" />}
                </span>
                <span className="text-[11px] mt-0.5 font-medium">Plus</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="admin-studio rounded-t-3xl border-[hsl(var(--admin-border))] pb-[max(env(safe-area-inset-bottom),16px)]">
              <SheetHeader>
                <SheetTitle className="font-display tracking-wide text-left text-[hsl(var(--admin-text))]">PLUS</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {moreItems.map(item => {
                  const Icon = item.icon;
                  const count = badgeFor(item.badge);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => cn(
                        'flex flex-col items-center justify-center gap-1.5 rounded-2xl min-h-[76px] border transition-colors',
                        isActive
                          ? 'border-[hsl(var(--admin-accent)/0.4)] bg-[hsl(var(--admin-accent)/0.08)] text-[hsl(var(--admin-accent))]'
                          : 'border-[hsl(var(--admin-border))] bg-white text-[hsl(var(--admin-text-muted))]'
                      )}
                    >
                      <span className="relative">
                        <Icon className="w-5 h-5" />
                        <CountBadge count={count} className="absolute -top-2 -right-4" />
                      </span>
                      <span className="text-xs font-medium">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;
