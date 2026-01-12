import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Wrench, Zap, Link2, Shield } from 'lucide-react';

import PartsManager from '@/components/admin/PartsManager';
import ScootersManager from '@/components/admin/ScootersManager';
import CompatibilityManager from '@/components/admin/CompatibilityManager';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('parts');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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
          <TabsList className="bg-background/10 border border-border/20 p-1 h-auto">
            <TabsTrigger 
              value="parts" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 px-6 py-3 gap-2"
            >
              <Wrench className="w-4 h-4" />
              Pièces
            </TabsTrigger>
            <TabsTrigger 
              value="scooters" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 px-6 py-3 gap-2"
            >
              <Zap className="w-4 h-4" />
              Trottinettes
            </TabsTrigger>
            <TabsTrigger 
              value="compatibility" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-background/70 px-6 py-3 gap-2"
            >
              <Link2 className="w-4 h-4" />
              Compatibilités
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
                  <p className="text-sm text-muted-foreground">Modifier les prix, stocks et images</p>
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
                  <p className="text-sm text-muted-foreground">Modifier les specs techniques et images</p>
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
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
