import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";

const EmptyCart = () => {
  const navigate = useNavigate();
  const { setIsOpen } = useCart();

  const handleReturnToCatalogue = () => {
    setIsOpen(false);
    navigate('/catalogue');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full px-6 text-center"
    >
      {/* Luxury Empty State Illustration */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative mb-8"
      >
        <div className="w-32 h-32 rounded-full bg-mineral/10 flex items-center justify-center">
          <ShoppingBag className="w-16 h-16 text-mineral/40" strokeWidth={1.5} />
        </div>
        {/* Decorative ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-mineral/20 animate-spin" style={{ animationDuration: '20s' }} />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="font-display text-2xl text-carbon mb-2 tracking-wide"
      >
        PANIER VIDE
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-sm mb-8 max-w-xs"
      >
        Votre panier attend ses premières pièces. Découvrez notre catalogue de pièces premium.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          variant="outline"
          onClick={handleReturnToCatalogue}
          className="border-mineral/30 text-mineral hover:bg-mineral/10 hover:border-mineral/50 font-display tracking-wider px-8 py-3 rounded-xl transition-all duration-300"
        >
          RETOUR AU CATALOGUE
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default EmptyCart;
