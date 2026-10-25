import SEO from "@/components/SEO";
import { useAdminRole } from '@/hooks/useAdminRole';
import { Navigate, Link, Route, Routes, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ShieldX } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import OrdersManager from '@/components/admin/OrdersManager';
import ClientsManager from '@/components/admin/ClientsManager';
import ContactMessagesManager from '@/components/admin/ContactMessagesManager';
import CatalogueSection from '@/components/admin/sections/CatalogueSection';
import BotsSection from '@/components/admin/sections/BotsSection';
import SiteSection from '@/components/admin/sections/SiteSection';
import MarketingSection from '@/components/admin/sections/MarketingSection';
import ReglagesSection from '@/components/admin/sections/ReglagesSection';
import ProsSection from '@/components/admin/pros/ProsSection';

/** Anciennes adresses ?tab=… (liens Telegram, favoris) → nouvelles routes. */
const LEGACY_TABS: Record<string, string> = {
  dashboard: '/admin',
  inventory: '/admin/catalogue',
  orders: '/admin/commandes',
  clients: '/admin/clients',
  scanner: '/admin/bots/scanner',
  messages: '/admin/messages',
  brand: '/admin/site/logo',
  'home-bridge': '/admin/site',
  settings: '/admin/reglages',
};

const HomeOrLegacyRedirect = () => {
  const [searchParams] = useSearchParams();
  if (searchParams.get('tri')) return <Navigate to="/admin/catalogue/tri" replace />;
  const tab = searchParams.get('tab');
  if (tab && LEGACY_TABS[tab]) return <Navigate to={LEGACY_TABS[tab]} replace />;
  return <AdminDashboard />;
};

const Admin = () => {
  const { user, isAdmin, loading } = useAdminRole();

  if (loading) {
    return (
      <div className="admin-studio min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--admin-accent))]" />
          <p className="text-[hsl(var(--admin-text-muted))] text-sm">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-studio min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center px-4">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--admin-text))] mb-2">Accès Refusé</h1>
            <p className="text-[hsl(var(--admin-text-muted))] max-w-md">
              Vous n'avez pas les permissions nécessaires.
            </p>
          </div>
          <Link to="/">
            <Button className="bg-green-700 hover:bg-green-800 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <SEO noindex title="Administration" description="Back-office Pièces Trottinettes" />
      <Routes>
        <Route index element={<HomeOrLegacyRedirect />} />
        <Route path="commandes" element={<div className="p-3 md:p-5"><OrdersManager /></div>} />
        <Route path="catalogue/:sub?" element={<CatalogueSection />} />
        <Route path="bots/:sub?" element={<BotsSection />} />
        <Route path="clients" element={<div className="p-3 md:p-5"><ClientsManager /></div>} />
        <Route path="messages" element={<div className="p-3 md:p-5"><ContactMessagesManager /></div>} />
        <Route path="marketing/:sub?" element={<MarketingSection />} />
        <Route path="pros/:sub?" element={<ProsSection />} />
        <Route path="site/:sub?" element={<SiteSection />} />
        <Route path="reglages" element={<ReglagesSection />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default Admin;
