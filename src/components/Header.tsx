import { Search, ShoppingCart, Menu, Home, LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logoImage from "@/assets/logo-pt.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useScootersGroupedByBrand } from "@/hooks/useScooterDetail";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: scootersByBrand = [] } = useScootersGroupedByBrand();

  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "Pièces Détachées", href: "/catalogue" },
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
            
            {/* Trottinettes Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                  Trottinettes
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                {scootersByBrand.map((brandGroup) => (
                  <DropdownMenuSub key={brandGroup.brand.id}>
                    <DropdownMenuSubTrigger className="font-medium">
                      {brandGroup.brand.name}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-48">
                      {brandGroup.models.map((model) => (
                        <DropdownMenuItem key={model.id} asChild>
                          <Link to={`/scooter/${model.slug}`} className="cursor-pointer">
                            {model.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))}
                {scootersByBrand.length === 0 && (
                  <DropdownMenuItem disabled>
                    Aucune trottinette
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-foreground">
              <Search className="w-5 h-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="relative text-foreground/80 hover:text-foreground">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                0
              </span>
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
              
              {/* Mobile Trottinettes Section */}
              <div className="px-4 py-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Trottinettes</p>
                <div className="space-y-1">
                  {scootersByBrand.slice(0, 5).map((brandGroup) => (
                    <div key={brandGroup.brand.id}>
                      <p className="text-xs font-medium text-foreground/70 py-1">{brandGroup.brand.name}</p>
                      {brandGroup.models.slice(0, 3).map((model) => (
                        <Link
                          key={model.id}
                          to={`/scooter/${model.slug}`}
                          className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {model.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
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
