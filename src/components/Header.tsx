import { Search, ShoppingCart, Menu, Home, LogIn, LogOut, User, Bike, ChevronDown, X, Plus, RefreshCw, AlertTriangle, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { useUserGarage } from "@/hooks/useGarage";
import { useCompatiblePartsCount } from "@/hooks/useCompatiblePartsCount";
import { useSpotlight } from "@/contexts/SpotlightContext";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo-pt.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevCountRef = useRef(0);
  const queryClient = useQueryClient();
  
  const { user, profile, signOut } = useAuth();
  const { setIsOpen: openCart, totals } = useCart();
  const { selectedScooter, setSelectedScooter, clearSelection, selectedBrandColors } = useSelectedScooter();
  const { data: garageScooters, isLoading: garageLoading } = useUserGarage();
  const { data: compatibleCount = 0 } = useCompatiblePartsCount(selectedScooter?.id);
  const { openSpotlight } = useSpotlight();
  const navigate = useNavigate();

  // Shimmer animation when item count increases
  useEffect(() => {
    if (totals.itemCount > prevCountRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1500);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = totals.itemCount;
  }, [totals.itemCount]);

  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "Pièces Détachées", href: "/catalogue" },
    { label: "Trottinettes", href: "/trottinettes" },
    { label: "Les Pépites", href: "/pepites" },
    { label: "Tutos", href: "/tutos" },
  ];

  const handleGarageClick = () => {
    if (user) {
      navigate('/garage');
    } else {
      navigate('/login');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    clearSelection(); // Clear selected scooter on logout
    navigate('/');
  };

  // 🚨 DÉCONNEXION D'URGENCE - Utilise supabase directement, bypass le contexte
  const handleEmergencySignOut = async () => {
    console.log('🚨 EMERGENCY SIGN OUT - Bypassing AuthContext');
    try {
      await supabase.auth.signOut();
      clearSelection();
      toast.success('Déconnexion réussie');
      window.location.href = '/'; // Hard redirect, pas de navigate
    } catch (error) {
      console.error('🚨 Emergency signout error:', error);
      // Force redirect même si erreur
      window.location.href = '/';
    }
  };

  // 🚨 BOUTON DE SECOURS - Force le rechargement du catalogue + hard reload
  const handleForceRefresh = () => {
    console.log('🚨 CATALOGUE FORCE REFRESH: clearing cache + hard reload');
    queryClient.clear();
    queryClient.invalidateQueries();
    toast.success('Rechargement en cours...');
    // Hard reload pour garantir un état propre
    setTimeout(() => window.location.reload(), 500);
  };

  // 🧹 NETTOYAGE COMPLET DU CACHE - Vide tout et recharge
  const handleFullCacheClear = async () => {
    console.log('🧹 FULL CACHE CLEAR: React Query + localStorage + sessionStorage + caches');
    
    // 1. Vider React Query
    queryClient.clear();
    
    // 2. Vider tout le storage local
    localStorage.clear();
    sessionStorage.clear();
    
    // 3. Vider les caches ServiceWorker si présents
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🧹 ServiceWorker caches cleared:', cacheNames.length);
      } catch (e) {
        console.warn('🧹 Could not clear SW caches:', e);
      }
    }
    
    toast.success('Cache nettoyé, rechargement...');
    
    // 4. Hard reload
    setTimeout(() => window.location.reload(), 300);
  };

  // Check if user has scooters in garage
  const hasGarageScooters = garageScooters && garageScooters.length > 0;
  const showEmptyGarageCTA = user && !garageLoading && !hasGarageScooters;
  const showLoginCTA = !user;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group hover:opacity-90 transition-opacity">
            <img 
              src={logoImage}
              alt="piècestrottinettes.FR"
              className="h-32 lg:h-36 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Mobile Slim Selector - Ultra compact badge for mobile */}
            {selectedScooter && (
              <Link 
                to="/garage"
                className={cn(
                  "flex md:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-full",
                  "bg-white/70 backdrop-blur-xl border-[0.5px]",
                  "transition-all duration-300",
                  selectedBrandColors.borderClass
                )}
                style={{ 
                  boxShadow: `0 0 12px ${selectedBrandColors.glowColor}`,
                }}
              >
                <Bike className={cn("w-3.5 h-3.5", selectedBrandColors.textClass)} />
                <span className={cn(
                  "text-xs font-medium max-w-[70px] truncate",
                  selectedBrandColors.textClass
                )}>
                  {selectedScooter.nickname || selectedScooter.modelName || selectedScooter.name}
                </span>
                {compatibleCount > 0 && (
                  <span 
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/60"
                    style={{ color: selectedBrandColors.accent }}
                  >
                    ({compatibleCount})
                  </span>
                )}
              </Link>
            )}

            {/* Ma Trottinette Selector - Monaco Design with Dynamic Brand Colors - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "hidden md:flex items-center gap-2 rounded-full px-4 h-auto min-h-10 py-2",
                    "bg-white/70 backdrop-blur-xl border-[0.5px]",
                    "hover:bg-white/90 transition-all duration-300",
                    selectedScooter 
                      ? [selectedBrandColors.borderClass, "border-[1.5px]"]
                      : "border-white/20 hover:border-mineral/30"
                  )}
                  style={selectedScooter ? {
                    boxShadow: `0 0 16px ${selectedBrandColors.glowColor}`,
                  } : undefined}
                >
                  <Bike className={cn(
                    "w-4 h-4 transition-colors flex-shrink-0",
                    selectedScooter ? selectedBrandColors.textClass : "text-muted-foreground"
                  )} />
                  
                  {/* Premium 3-Line Display when scooter selected */}
                  {selectedScooter ? (
                    <div className="flex flex-col items-start leading-tight max-w-[160px]">
                      {/* Line 1: MARQUE - micro-caps */}
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                        {selectedScooter.brandName}
                      </span>
                      {/* Line 2: Modèle - Bold with brand color */}
                      <span className={cn(
                        "text-sm font-bold truncate w-full",
                        selectedBrandColors.textClass
                      )}>
                        {selectedScooter.modelName || selectedScooter.name}
                      </span>
                      {/* Line 3: « Surnom » - Italic with glow */}
                      {selectedScooter.nickname && (
                        <span 
                          className="text-xs italic truncate w-full"
                          style={{ 
                            color: selectedBrandColors.accent,
                            textShadow: `0 0 8px ${selectedBrandColors.glowColor}`
                          }}
                        >
                          « {selectedScooter.nickname} »
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      Ma Trottinette
                    </span>
                  )}
                  
                  <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-72 bg-white/95 backdrop-blur-xl border-[0.5px] border-white/20 shadow-2xl rounded-xl z-50"
              >
                <DropdownMenuLabel className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground px-3 py-2">
                  Ma Trottinette
                  {selectedScooter && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs hover:text-destructive"
                      onClick={(e) => { e.preventDefault(); clearSelection(); }}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Retirer
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Loading State */}
                {garageLoading && (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    Chargement...
                  </div>
                )}

                {/* Not Logged In - Premium CTA */}
                {showLoginCTA && (
                  <div className="flex flex-col items-center py-6 px-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-garage/10 flex items-center justify-center mb-4">
                      <Bike className="w-7 h-7 text-garage" />
                    </div>
                    <p className="text-sm font-medium text-carbon mb-1">
                      Vérifiez la compatibilité
                    </p>
                    <p className="text-xs text-muted-foreground mb-5 max-w-[200px]">
                      Connectez-vous et ajoutez votre machine pour voir les pièces compatibles
                    </p>
                    <Button 
                      onClick={() => navigate('/login')}
                      className="rounded-full bg-garage text-white px-6 hover:bg-garage/90 transition-all"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Se connecter
                    </Button>
                  </div>
                )}

                {/* Logged In but Empty Garage - Premium CTA */}
                {showEmptyGarageCTA && (
                  <div className="flex flex-col items-center py-6 px-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-garage/10 flex items-center justify-center mb-4">
                      <Plus className="w-7 h-7 text-garage" />
                    </div>
                    <p className="text-sm font-medium text-carbon mb-1">
                      Aucune trottinette
                    </p>
                    <p className="text-xs text-muted-foreground mb-5 max-w-[200px]">
                      Ajoutez votre machine pour vérifier la compatibilité des pièces
                    </p>
                    <Button 
                      onClick={() => navigate('/garage')}
                      className="rounded-full bg-garage text-white px-6 hover:bg-garage/90 transition-all"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter ma trottinette
                    </Button>
                  </div>
                )}

                {/* User has scooters in garage */}
                {hasGarageScooters && (
                  <ScrollArea className="h-[280px]">
                    {garageScooters.map((garageItem) => {
                      const scooterModel = garageItem.scooter_model;
                      if (!scooterModel) return null;
                      
                      const brandName = typeof scooterModel.brand === 'object' && scooterModel.brand 
                        ? scooterModel.brand.name 
                        : 'Unknown';
                      
                      return (
                        <DropdownMenuItem
                          key={garageItem.id}
                          onClick={() => setSelectedScooter({
                            id: scooterModel.id,
                            name: garageItem.nickname || scooterModel.name,
                            slug: scooterModel.slug,
                            brandName: brandName,
                            imageUrl: garageItem.custom_photo_url || scooterModel.image_url,
                            // Enhanced fields for sync
                            modelName: scooterModel.name,
                            nickname: garageItem.nickname,
                            garageItemId: garageItem.id,
                          })}
                          className={cn(
                            "flex items-center gap-3 py-3 px-3 cursor-pointer",
                            "hover:bg-mineral/5 transition-all duration-200",
                            selectedScooter?.id === scooterModel.id && "bg-mineral/10"
                          )}
                        >
                          {(garageItem.custom_photo_url || scooterModel.image_url) ? (
                            <img 
                              src={garageItem.custom_photo_url || scooterModel.image_url || ''} 
                              alt={scooterModel.name}
                              className="w-10 h-10 object-contain rounded-lg bg-greige p-0.5"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-greige flex items-center justify-center">
                              <Bike className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {garageItem.nickname || scooterModel.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {brandName}
                              {garageItem.is_owned && (
                                <span className="ml-2 text-garage">• Mon écurie</span>
                              )}
                            </p>
                          </div>
                          {selectedScooter?.id === scooterModel.id && (
                            <div 
                              className="w-2.5 h-2.5 rounded-full animate-pulse"
                              style={{ backgroundColor: selectedBrandColors.accent }}
                            />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                    
                    {/* Add more scooters link */}
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem
                      onClick={() => navigate('/garage')}
                      className="flex items-center gap-3 py-3 px-3 cursor-pointer text-garage hover:bg-garage/5"
                    >
                      <div className="w-10 h-10 rounded-lg bg-garage/10 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-garage" />
                      </div>
                      <span className="text-sm font-medium">Gérer mon garage</span>
                    </DropdownMenuItem>
                  </ScrollArea>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Spotlight Search Trigger - Desktop Only (Mobile uses Dock) */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={openSpotlight}
              className="relative text-foreground/80 hover:text-foreground group hidden md:flex"
            >
              <Search className="w-5 h-5" />
              {/* ⌘K shortcut indicator */}
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 
                             text-[9px] font-mono text-carbon/40 opacity-0 
                             group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ⌘K
              </span>
            </Button>
            
            {/* Cart Button - Desktop Only (Mobile uses Dock) */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => openCart(true)}
              className="relative text-foreground/80 hover:text-foreground hidden md:flex"
            >
              <ShoppingCart className="w-5 h-5" />
              {totals.itemCount > 0 && (
                <span 
                  className={cn(
                    "absolute -top-1 -right-1 w-5 h-5 rounded-full bg-mineral text-white text-xs flex items-center justify-center font-medium",
                    isAnimating && "animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,hsl(var(--mineral))_0%,hsl(var(--mineral))_35%,rgba(255,255,255,0.4)_50%,hsl(var(--mineral))_65%,hsl(var(--mineral))_100%)]"
                  )}
                >
                  {totals.itemCount > 99 ? '99+' : totals.itemCount}
                </span>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="hidden sm:flex rounded-full px-4 font-display text-lg tracking-wide gap-2 bg-garage text-garage-foreground hover:bg-garage/90"
                  >
                    <div className="w-6 h-6 rounded-full bg-garage-foreground/20 flex items-center justify-center text-sm font-semibold">
                      {profile?.display_name?.charAt(0).toUpperCase() || 'R'}
                    </div>
                    Mon Garage
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/garage" className="flex items-center gap-2 cursor-pointer">
                      <Home className="w-4 h-4" />
                      Mon Garage
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/garage" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      {profile?.performance_points || 0} points
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleForceRefresh}
                    className="flex items-center gap-2 cursor-pointer text-amber-600"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Forcer le rechargement
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleFullCacheClear}
                    className="flex items-center gap-2 cursor-pointer text-orange-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Nettoyage complet du cache
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-garage"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleEmergencySignOut}
                    className="flex items-center gap-2 cursor-pointer text-destructive font-medium"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Déconnexion d'urgence
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={handleGarageClick}
                className="hidden sm:flex rounded-full px-6 font-display text-lg tracking-wide gap-2 bg-garage text-garage-foreground hover:bg-garage/90"
              >
                <LogIn className="w-4 h-4" />
                Mon Garage
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-4 py-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link 
                    to="/garage"
                    className="mt-2 flex items-center justify-center gap-2 rounded-full py-3 font-display text-lg tracking-wide bg-garage text-garage-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Home className="w-4 h-4" />
                    Mon Garage
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                    className="text-garage"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => { handleGarageClick(); setIsMenuOpen(false); }}
                  className="mt-2 rounded-full font-display text-lg tracking-wide gap-2 bg-garage text-garage-foreground hover:bg-garage/90"
                >
                  <LogIn className="w-4 h-4" />
                  Mon Garage
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
