/**
 * « Vous pourriez aussi avoir besoin de » — fiche produit.
 * 19/10/2026 : passé sur la carte « Ça dépasse » (PartCardAtelier) choisie par Nolan pour tout le site ;
 * avant : cartes vitrées arrondies, titre Bebas, prix « 9.00 € ».
 */
import { Skeleton } from "@/components/ui/skeleton";
import PartCardAtelier from "@/components/parts/PartCardAtelier";
import type { CompatiblePart } from "@/hooks/useScooterData";

interface RelatedPart {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  images?: unknown;
  stock_quantity: number | null;
  category?: { id: string; name: string; slug: string; color?: string | null } | null;
}

interface RelatedProductsProps {
  parts: RelatedPart[];
  isLoading: boolean;
}

const UNB = "'Unbounded', sans-serif";

const RelatedProducts = ({ parts, isLoading }: RelatedProductsProps) => {
  if (isLoading) {
    return (
      <section className="w-full max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      </section>
    );
  }
  if (!parts || parts.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto">
      <h2 className="text-2xl md:text-3xl uppercase leading-none mb-2"
        style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: "#1A1A1A" }}>
        Vous pourriez aussi avoir besoin de
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 md:gap-x-6">
        {parts.map((part) => (
          <PartCardAtelier key={part.id} look={1} part={part as unknown as CompatiblePart & { slug?: string }} className="h-full" />
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
