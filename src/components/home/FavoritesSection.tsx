import { motion } from "framer-motion";
import { Heart, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserGarage } from "@/hooks/useGarage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Import scooter images
import xiaomiMiPro2 from "@/assets/scooters/xiaomi-mi-pro-2.png";
import xiaomiMiEssential from "@/assets/scooters/xiaomi-mi-essential.png";
import xiaomiMi3 from "@/assets/scooters/xiaomi-mi-3.png";
import ninebotG30Max from "@/assets/scooters/ninebot-g30-max.png";
import ninebotF40 from "@/assets/scooters/ninebot-f40.png";
import segwayP100s from "@/assets/scooters/segway-p100s.png";
import segwayNinebotMaxG2 from "@/assets/scooters/segway-ninebot-max-g2.png";
import dualtronThunder from "@/assets/scooters/dualtron-thunder.png";
import dualtronVictor from "@/assets/scooters/dualtron-victor.png";
import kaaboMantisPro from "@/assets/scooters/kaabo-mantis-pro.png";
import kaaboWolfWarrior from "@/assets/scooters/kaabo-wolf-warrior.png";

const scooterImages: Record<string, string> = {
  "mi-pro-2": xiaomiMiPro2,
  "mi-essential": xiaomiMiEssential,
  "mi-3": xiaomiMi3,
  "g30-max": ninebotG30Max,
  "f40": ninebotF40,
  "p100s": segwayP100s,
  "ninebot-max-g2": segwayNinebotMaxG2,
  "thunder": dualtronThunder,
  "victor": dualtronVictor,
  "mantis-pro": kaaboMantisPro,
  "wolf-warrior": kaaboWolfWarrior,
};

const FavoritesSection = () => {
  const { user } = useAuthContext();
  const { data: garage, isLoading } = useUserGarage();

  // Filter only favorites (not owned)
  const favorites = garage?.filter((item) => !item.is_owned) || [];

  // Don't show section if not logged in
  if (!user) return null;

  // Show loading state
  if (isLoading) {
    return (
      <section className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-5 h-5 text-mineral" />
          <h2 className="font-display text-xl text-carbon">Mes Favoris</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-48 h-56 rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  // Don't show if no favorites
  if (favorites.length === 0) return null;

  return (
    <section className="container mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-mineral/10">
            <Heart className="w-5 h-5 text-mineral fill-mineral/20" />
          </div>
          <div>
            <h2 className="font-display text-xl text-carbon">Mes Favoris</h2>
            <p className="text-sm text-muted-foreground">{favorites.length} trottinette{favorites.length > 1 ? 's' : ''} sauvegardée{favorites.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link to="/garage">
          <Button variant="ghost" size="sm" className="gap-2 text-mineral hover:text-mineral-dark">
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {favorites.map((item, index) => {
          const scooterModel = item.scooter_model;
          if (!scooterModel) return null;

          const imageSrc = scooterImages[scooterModel.slug] || scooterModel.image_url || "/placeholder.svg";

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex-shrink-0 w-48"
            >
              <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-mineral/10 p-4 hover:border-mineral/30 hover:shadow-lg transition-all duration-300">
                {/* Favorite Badge */}
                <div className="absolute top-3 right-3 p-1.5 rounded-full bg-mineral/10">
                  <Heart className="w-3.5 h-3.5 text-mineral fill-mineral" />
                </div>

                {/* Image */}
                <div className="relative w-full h-28 mb-3">
                  <img
                    src={imageSrc}
                    alt={scooterModel.name}
                    className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {scooterModel.brand?.name}
                  </p>
                  <h3 className="font-display text-sm text-carbon truncate">
                    {scooterModel.name}
                  </h3>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-mineral/10">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="w-3 h-3 text-mineral" />
                    <span>{scooterModel.power_watts || 0}W</span>
                  </div>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="text-xs text-muted-foreground">{scooterModel.max_speed_kmh || 0}km/h</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default FavoritesSection;
