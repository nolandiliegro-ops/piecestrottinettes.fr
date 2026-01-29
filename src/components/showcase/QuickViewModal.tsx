import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, ExternalLink, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/formatPrice";
import { useCart } from "@/hooks/useCart";
import DifficultyIndicator from "@/components/parts/DifficultyIndicator";
import { toast } from "sonner";

interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
}

interface QuickViewModalProps {
  part: Part;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal = ({ part, isOpen, onClose }: QuickViewModalProps) => {
  const navigate = useNavigate();
  const { addItem, setIsOpen } = useCart();
  const isInStock = (part.stock_quantity ?? 0) > 0;

  const handleAddToCart = () => {
    if (part.price === null || !isInStock) return;
    
    addItem({
      id: part.id,
      name: part.name,
      price: part.price,
      image_url: part.image_url,
      stock_quantity: part.stock_quantity || 0,
    });
    
    toast.success("Pièce ajoutée au panier", {
      action: { label: "Voir", onClick: () => setIsOpen(true) }
    });
    
    onClose();
  };

  const handleViewDetails = () => {
    onClose();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => navigate(`/piece/${part.slug}`), 150);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop avec blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{
              background: "rgba(26, 26, 26, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />
          
          {/* Modale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="relative w-full max-w-3xl pointer-events-auto rounded-3xl overflow-hidden"
              style={{
                background: "rgba(250, 250, 248, 0.98)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                boxShadow: "0 32px 64px rgba(26, 26, 26, 0.2)"
              }}
              role="dialog"
              aria-modal="true"
            >
              {/* Bouton Fermer */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-carbon/5 hover:bg-carbon/10 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-carbon" />
              </motion.button>

              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Section */}
                <div className="relative aspect-square bg-greige flex items-center justify-center p-8">
                  {part.image_url ? (
                    <motion.img
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      src={part.image_url}
                      alt={part.name}
                      className="w-full h-full object-contain"
                      style={{
                        filter: "drop-shadow(0 20px 40px rgba(26, 26, 26, 0.15))"
                      }}
                    />
                  ) : (
                    <Package className="w-24 h-24 text-carbon/20" />
                  )}
                </div>

                {/* Info Section */}
                <div className="p-8 flex flex-col justify-center space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                  >
                    <h2 className="text-2xl font-semibold text-carbon leading-tight mb-4">
                      {part.name}
                    </h2>
                    
                    <p className="text-4xl font-extrabold text-mineral">
                      {part.price ? formatPrice(part.price) : "Prix sur demande"}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="space-y-4"
                  >
                    {/* Difficulté */}
                    <div className="flex items-center justify-between py-3 border-b border-carbon/10">
                      <span className="text-sm text-carbon/60">Difficulté</span>
                      <DifficultyIndicator 
                        level={part.difficulty_level} 
                        showLabel 
                        variant="compact"
                      />
                    </div>

                    {/* Stock */}
                    <div className="flex items-center justify-between py-3 border-b border-carbon/10">
                      <span className="text-sm text-carbon/60">Disponibilité</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            isInStock ? "bg-green-500 animate-pulse" : "bg-red-500"
                          }`}
                        />
                        <span className={`text-sm font-medium ${
                          isInStock ? "text-green-600" : "text-red-600"
                        }`}>
                          {isInStock 
                            ? `En stock (${part.stock_quantity})` 
                            : "Rupture de stock"
                          }
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="space-y-3 pt-4"
                  >
                    {/* Bouton Ajouter au Panier */}
                    <button
                      onClick={handleAddToCart}
                      disabled={!isInStock || part.price === null}
                      className="w-full py-4 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-mineral hover:bg-mineral-dark"
                      style={{
                        boxShadow: isInStock 
                          ? "0 8px 24px rgba(147, 181, 161, 0.4)"
                          : "none"
                      }}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Ajouter au Panier</span>
                    </button>

                    {/* Lien vers fiche complète */}
                    <button
                      onClick={handleViewDetails}
                      className="w-full py-3 text-center text-carbon/70 hover:text-mineral font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Voir la fiche complète</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;
