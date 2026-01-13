import { motion } from "framer-motion";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AffiliateButtonProps {
  affiliateLink: string;
  scooterName: string;
}

const AffiliateButton = ({ affiliateLink, scooterName }: AffiliateButtonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-12 lg:py-16"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-card to-primary/5 border border-primary/20 p-8 lg:p-12">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-radial from-primary/15 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="font-display text-3xl lg:text-4xl text-foreground mb-2">
                ACHETER LA {scooterName.toUpperCase()}
              </h3>
              <p className="text-muted-foreground text-lg max-w-xl">
                Découvrez cette trottinette chez notre partenaire officiel. Livraison rapide et garantie constructeur.
              </p>
            </div>

            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-lg gap-3 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <a
                href={affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ShoppingBag className="w-5 h-5" />
                Acheter maintenant
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AffiliateButton;
