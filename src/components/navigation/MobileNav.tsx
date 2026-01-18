import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, LayoutGrid, Play, ShoppingBag } from 'lucide-react';
import { useSelectedScooter } from '@/contexts/ScooterContext';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  action?: () => void;
}

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedBrandColors, selectedScooter } = useSelectedScooter();
  const { setIsOpen: openCart, totals } = useCart();

  const navItems: NavItem[] = [
    { icon: Package, label: 'Pièces', path: '/catalogue' },
    { icon: LayoutGrid, label: 'Garage', path: '/garage' },
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
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  // Get active color based on selected scooter brand
  const activeColor = selectedScooter ? selectedBrandColors.accent : 'hsl(var(--mineral))';
  const activeGlow = selectedScooter ? selectedBrandColors.glowColor : 'rgba(107, 142, 137, 0.4)';

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: 'spring', 
        damping: 25, 
        stiffness: 300,
        delay: 0.2 
      }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "md:hidden", // Only visible on mobile
        "bg-white/80 backdrop-blur-xl",
        "border-t-[0.5px] border-white/30",
        "pb-safe" // Safe area for notched devices
      )}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
      }}
    >
      {/* Subtle top shadow for depth */}
      <div className="absolute inset-x-0 -top-4 h-4 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const isCart = item.label === 'Panier';
          
          return (
            <motion.button
              key={item.label}
              onClick={() => handleClick(item)}
              whileTap={{ scale: 0.92 }}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "min-w-[64px] min-h-[48px] px-3 py-2", // Thumb-friendly: 48px+ touch target
                "rounded-xl transition-all duration-300",
                active ? "bg-white/60" : "hover:bg-white/40"
              )}
            >
              {/* Icon with Neon Pulse effect when active */}
              <motion.div
                className="relative"
                animate={active ? {
                  scale: [1, 1.08, 1],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-colors duration-300",
                    active ? "" : "text-muted-foreground"
                  )}
                  style={active ? { color: activeColor } : undefined}
                />
                
                {/* Neon Pulse Glow - Only when active */}
                {active && (
                  <motion.div
                    className="absolute inset-0 rounded-full blur-md -z-10"
                    animate={{
                      opacity: [0.4, 0.7, 0.4],
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      backgroundColor: activeGlow,
                    }}
                  />
                )}
                
                {/* Cart Badge */}
                {isCart && totals.itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "absolute -top-1.5 -right-1.5",
                      "min-w-[18px] h-[18px] px-1",
                      "flex items-center justify-center",
                      "rounded-full text-[10px] font-bold text-white",
                      "bg-mineral"
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
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                  style={{ backgroundColor: activeColor }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileNav;
