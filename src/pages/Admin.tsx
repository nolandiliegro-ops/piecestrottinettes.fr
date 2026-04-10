import SEO from "@/components/SEO";
import { useState } from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ShieldX } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminInventory from '@/components/admin/AdminInventory';
import AdminScanner from '@/components/admin/AdminScanner';
import AdminSettings from '@/components/admin/AdminSettings';

const Admin = () => {
  const { user, isAdmin, loading } = useAdminRole();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(0_0%_10%)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-[hsl(0_0%_55%)] text-sm">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[hsl(0_0%_10%)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center px-4">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(0_0%_95%)] mb-2">Accès Refusé</h1>
            <p className="text-[hsl(0_0%_55%)] max-w-md">
              Vous n'avez pas les permissions nécessaires.
            </p>
          </div>
          <Link to="/">
            <Button className="bg-primary hover:bg-primary/90">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <SEO noindex title="Administration" description="Back-office Pièces Trottinettes" />
      {activeTab === 'dashboard' && <AdminDashboard />}
      {activeTab === 'inventory' && <AdminInventory />}
      {activeTab === 'scanner' && <AdminScanner />}
      {activeTab === 'settings' && <AdminSettings />}
    </AdminLayout>
  );
};

export default Admin;
