import { useState } from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Wrench, Zap, Link2, Shield, Tag, Building, ShieldX, Package, GraduationCap } from 'lucide-react';

import PartsManager from '@/components/admin/PartsManager';
import ScootersManager from '@/components/admin/ScootersManager';
import CompatibilityManager from '@/components/admin/CompatibilityManager';
import CategoriesManager from '@/components/admin/CategoriesManager';
import BrandsManager from '@/components/admin/BrandsManager';
import OrdersManager from '@/components/admin/OrdersManager';
import TutosManager from '@/components/admin/TutosManager';

const Admin = () => {
  const { user, isAdmin, loading } = useAdminRole();
  const [activeTab, setActiveTab] = useState('parts');

  if (loading) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-background/60 text-sm">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center px-4">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-background mb-2">Accès Refusé</h1>
            <p className="text-background/60 max-w-md">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              Seuls les administrateurs peuvent gérer le catalogue.
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
    <div className="min-h-screen bg-foreground">
      {/* Header Bar */}
      <header className="border-b border-border/20 bg-foreground/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-background hover:bg-background/10">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-background tracking-tight">
                    Admin Studio
                  </h1>
                  <p className="text-xs text-background/50">
                    Panneau d'administration
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full font-medium">
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-background/10 border border-border/20 p-1 h-auto flex-wrap">
            <TabsTrigger 
              value="parts" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 px-4 py-2 gap-2"
            >
              <Wrench className="w-4 h-4" />
              Pièces
            </TabsTrigger>
            <TabsTrigger 
              value="scooters" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 px-4 py-2 gap-2"
            >
              <Zap className="w-4 h-4" />
              Trottinettes
            </TabsTrigger>
            <TabsTrigger 
              value="compatibility" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 px-4 py-2 gap-2"
            >
              <Link2 className="w-4 h-4" />
              Compatibilités
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 px-4 py-2 gap-2"
            >
              <Tag className="w-4 h-4" />
              Catégories
            </TabsTrigger>
            <TabsTrigger 
              value="brands" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 px-4 py-2 gap-2"
            >
              <Building className="w-4 h-4" />
              Marques
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 px-4 py-2 gap-2"
            >
              <Package className="w-4 h-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger 
              value="tutos" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 px-4 py-2 gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Tutos
            </TabsTrigger>
          </TabsList>

          {/* Parts Tab */}
          <TabsContent value="parts" className="mt-6">
            <div className="rounded-xl border border-border/20 bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Gestion des Pièces</h2>
                  <p className="text-sm text-muted-foreground">Créer, modifier et supprimer les pièces</p>
                </div>
              </div>
              <PartsManager />
            </div>
          </TabsContent>

          {/* Scooters Tab */}
          <TabsContent value="scooters" className="mt-6">
            <div className="rounded-xl border border-border/20 bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Gestion des Trottinettes</h2>
                  <p className="text-sm text-muted-foreground">Créer, modifier et supprimer les modèles</p>
                </div>
              </div>
              <ScootersManager />
            </div>
          </TabsContent>

          {/* Compatibility Tab */}
          <TabsContent value="compatibility" className="mt-6">
            <div className="rounded-xl border border-border/20 bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Gestionnaire de Compatibilités</h2>
                  <p className="text-sm text-muted-foreground">Lier les pièces aux modèles de trottinettes</p>
                </div>
              </div>
              <CompatibilityManager />
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <div className="rounded-xl border border-border/20 bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Gestion des Catégories</h2>
                  <p className="text-sm text-muted-foreground">Organiser les catégories de pièces</p>
                </div>
              </div>
              <CategoriesManager />
            </div>
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands" className="mt-6">
            <div className="rounded-xl border border-border/20 bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Gestion des Marques</h2>
                  <p className="text-sm text-muted-foreground">Gérer les marques de trottinettes</p>
                </div>
              </div>
              <BrandsManager />
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-6">
            <div className="rounded-xl border border-border/20 bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Gestion des Commandes</h2>
                  <p className="text-sm text-muted-foreground">Voir et gérer les commandes clients</p>
                </div>
              </div>
              <OrdersManager />
            </div>
          </TabsContent>

          {/* Tutos Tab */}
          <TabsContent value="tutos" className="mt-6">
            <div className="rounded-xl border border-border/20 bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-mineral/15 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-mineral" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Gestion des Tutoriels</h2>
                  <p className="text-sm text-muted-foreground">Créer et gérer les vidéos Academy</p>
                </div>
              </div>
              <TutosManager />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
