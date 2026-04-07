import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Play, ShoppingBag, Search, Bike } from 'lucide-react';
import { useSelectedScooter } from '@/contexts/ScooterContext';
import { useCart } from '@/hooks/useCart';
import { useSpotlight } from '@/contexts/SpotlightContext';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  action?: () => void;
  isSpotlight?: boolean;
}

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedBrandColors, selectedScooter } = useSelectedScooter();
  const { setIsOpen: openCart, totals } = useCart();
  const { openSpotlight } = useSpotlight();

  const navItems: NavItem[] = [
    { icon: Package, label: 'Pièces', path: '/catalogue' },
    { icon: Bike, label: 'Garage', path: '/garage' },
    { icon: Search, label: 'Chercher', action: () => openSpotlight(), isSpotlight: true },
    { icon: Play, label: 'Tutos', path: '/tutos' },
    { icon: ShoppingBag, label: 'Panier', action: () => openCart(true) },
  ];

  const isActive = (item: NavItem) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    return false;
  };

  const handleClick = (item: NavItem) => {
    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  // Get active color based on selected scooter brand
  const activeColor = selectedScooter ? selectedBrandColors.accent : 'hsl(var(--mineral))';
  const brandGlow = selectedScooter ? selectedBrandColors.glowColor : 'rgba(107, 142, 137, 0.15)';

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: 'spring', 
        damping: 20, 
        stiffness: 250,
        delay: 0.1 
      }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "md:hidden", // Only visible on mobile
        "bg-white/85 backdrop-blur-2xl",
        "border-t-[0.5px] border-white/40"
      )}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        boxShadow: `0 -4px 30px ${brandGlow}`,
      }}
    >
      {/* Top gradient fade for depth */}
      <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
      
      <div className="flex items-end justify-around px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const isCart = item.label === 'Panier';
          const isGarage = item.path === '/garage';
          const isSpotlight = item.isSpotlight;
          
          // Spotlight FAB (Central Button)
          if (isSpotlight) {
            return (
              <motion.button
                key={item.label}
                onClick={() => handleClick(item)}
                whileTap={{ 
                  scale: 0.88,
                  transition: { type: 'spring', stiffness: 500, damping: 15 }
                }}
                className={cn(
                  "relative flex items-center justify-center",
                  "w-14 h-14 -mt-5 rounded-full",
                  "bg-gradient-to-br from-white/95 to-white/80",
                  "backdrop-blur-2xl shadow-lg",
                  "border-[0.5px] border-white/50"
                )}
                style={{
                  boxShadow: `0 4px 20px ${brandGlow}, 0 0 0 1px rgba(255,255,255,0.3)`,
                }}
              >
                {/* Pulsing Glow Ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    background: `radial-gradient(circle, ${brandGlow} 0%, transparent 70%)`,
                  }}
                />
                
                {/* Icon */}
                <Search 
                  className="w-5 h-5 relative z-10"
                  style={{ color: activeColor }}
                />
              </motion.button>
            );
          }
          
          return (
            <motion.button
              key={item.label}
              onClick={() => handleClick(item)}
              whileTap={{ 
                scale: 0.88,
                transition: { type: 'spring', stiffness: 500, damping: 15 }
              }}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "min-w-[60px] min-h-[48px] px-2 py-2",
                "rounded-xl transition-all duration-300",
                active 
                  ? "bg-white/70 shadow-sm" 
                  : "hover:bg-white/40"
              )}
            >
              {/* Icon Container */}
              <motion.div
                className="relative"
                animate={active ? {
                  scale: [1, 1.06, 1],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Garage Button with Scooter Thumbnail */}
                {isGarage && selectedScooter?.imageUrl ? (
                  <div className="relative">
                    <Icon 
                      className={cn(
                        "w-5 h-5 transition-colors duration-300",
                        active ? "" : "text-muted-foreground"
                      )}
                      style={active ? { color: activeColor } : undefined}
                    />
                    {/* Scooter Thumbnail Overlay */}
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                      className={cn(
                        "absolute -top-2 -right-2",
                        "w-5 h-5 rounded-full overflow-hidden",
                        "bg-white/95 border-[0.5px] border-white/60",
                        "shadow-sm"
                      )}
                    >
                      <img 
                        src={selectedScooter.imageUrl} 
                        alt=""
                        className="w-full h-full object-contain p-0.5"
                      />
                    </motion.div>
                  </div>
                ) : (
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-colors duration-300",
                      active ? "" : "text-muted-foreground"
                    )}
                    style={active ? { color: activeColor } : undefined}
                  />
                )}
                
                {/* Active Glow Effect */}
                {active && (
                  <motion.div
                    className="absolute inset-0 rounded-full blur-md -z-10"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.4, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      backgroundColor: brandGlow,
                    }}
                  />
                )}
                
                {/* Cart Badge */}
                {isCart && totals.itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className={cn(
                      "absolute -top-1.5 -right-1.5",
                      "min-w-[18px] h-[18px] px-1",
                      "flex items-center justify-center",
                      "rounded-full text-[10px] font-bold text-white",
                      "bg-mineral shadow-sm"
                    )}
                  >
                    {totals.itemCount > 99 ? '99+' : totals.itemCount}
                  </motion.span>
                )}
              </motion.div>
              
              {/* Label */}
              <span 
                className={cn(
                  "text-[10px] font-medium mt-1 transition-colors duration-300",
                  active ? "" : "text-muted-foreground"
                )}
                style={active ? { color: activeColor } : undefined}
              >
                {item.label}
              </span>
              
              {/* Active Indicator Dot */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                    style={{ backgroundColor: activeColor }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileNav;
