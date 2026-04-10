import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingCart, Package } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/formatPrice";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface RelatedPart {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
}

interface RelatedProductsProps {
  parts: RelatedPart[];
  isLoading: boolean;
}

const RelatedProducts = ({ parts, isLoading }: RelatedProductsProps) => {
  const { addItem } = useCart();

  if (isLoading) {
    return (
      <section className="w-full max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!parts || parts.length === 0) return null;

  const handleAddToCart = (part: RelatedPart, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!part.price || !part.stock_quantity || part.stock_quantity <= 0) return;
    addItem({
      id: part.id,
      name: part.name,
      price: part.price,
      image_url: part.image_url,
      stock_quantity: part.stock_quantity,
    });
    toast.success(`${part.name} ajouté au panier`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="w-full max-w-7xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--mineral))]/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-[hsl(var(--mineral))]" />
        </div>
        <h2 className="font-black text-[hsl(var(--carbon))] uppercase tracking-tight text-xl">
          Vous pourriez aussi avoir besoin de
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {parts.map((part, index) => (
          <motion.div
            key={part.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: [0.32, 0.72, 0, 1] }}
          >
            <Link
              to={`/piece/${part.slug}`}
              className="group block h-full rounded-2xl shadow-md bg-white/70 backdrop-blur-sm border border-white/40 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Image */}
              <div className="aspect-square bg-[hsl(var(--muted))] overflow-hidden">
                {part.image_url ? (
                  <img
                    src={part.image_url}
                    alt={part.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-[hsl(var(--muted-foreground))]/30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col gap-2">
                <h3 className="font-bold text-[hsl(var(--carbon))] text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                  {part.name}
                </h3>

                {part.price != null && (
                  <p className="font-black text-[hsl(var(--mineral))] text-lg">
                    {formatPrice(part.price * 1.2)}
                  </p>
                )}

                <button
                  onClick={(e) => handleAddToCart(part, e)}
                  disabled={!part.stock_quantity || part.stock_quantity <= 0}
                  className="mt-auto min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF6600] hover:bg-[#E55C00] text-white font-bold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Ajouter</span>
                </button>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default RelatedProducts;
