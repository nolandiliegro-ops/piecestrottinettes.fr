import { Search, ShoppingCart, Menu, Home, LogIn, LogOut, User, Bike, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useSelectedScooter } from "@/contexts/ScooterContext";
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
  const { user, profile, signOut } = useAuth();
  const { setIsOpen: openCart, totals } = useCart();
  const { selectedScooter, setSelectedScooter, clearSelection, allScooters, isLoading: scootersLoading } = useSelectedScooter();
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
    navigate('/');
  };

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
            {/* Ma Trottinette Selector - Monaco Design */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "hidden md:flex items-center gap-2 rounded-full px-4 h-10",
                    "bg-white/70 backdrop-blur-xl border-[0.5px] border-white/20",
                    "hover:bg-white/90 hover:border-mineral/30 transition-all",
                    selectedScooter && "border-mineral/40 bg-mineral/5"
                  )}
                >
                  <Bike className={cn("w-4 h-4", selectedScooter ? "text-mineral" : "text-muted-foreground")} />
                  <span className="text-sm font-medium max-w-[140px] truncate">
                    {selectedScooter ? selectedScooter.name : "Ma Trottinette"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 bg-white/95 backdrop-blur-xl border-[0.5px] border-white/20 shadow-2xl rounded-xl z-50"
              >
                <DropdownMenuLabel className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
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
                <ScrollArea className="h-[280px]">
                  {scootersLoading ? (
                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                      Chargement...
                    </div>
                  ) : allScooters.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                      Aucun modèle disponible
                    </div>
                  ) : (
                    allScooters.map((scooter) => (
                      <DropdownMenuItem
                        key={scooter.id}
                        onClick={() => setSelectedScooter({
                          id: scooter.id,
                          name: scooter.name,
                          slug: scooter.slug,
                          brandName: scooter.brandName,
                          imageUrl: scooter.imageUrl,
                        })}
                        className={cn(
                          "flex items-center gap-3 py-2.5 px-3 cursor-pointer",
                          "hover:bg-mineral/5 transition-colors",
                          selectedScooter?.id === scooter.id && "bg-mineral/10"
                        )}
                      >
                        {scooter.imageUrl ? (
                          <img 
                            src={scooter.imageUrl} 
                            alt={scooter.name}
                            className="w-8 h-8 object-contain rounded bg-greige p-0.5"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-greige flex items-center justify-center">
                            <Bike className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{scooter.name}</p>
                          <p className="text-xs text-muted-foreground">{scooter.brandName}</p>
                        </div>
                        {selectedScooter?.id === scooter.id && (
                          <div className="w-2 h-2 rounded-full bg-mineral" />
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-foreground">
              <Search className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => openCart(true)}
              className="relative text-foreground/80 hover:text-foreground"
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
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-garage"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
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
