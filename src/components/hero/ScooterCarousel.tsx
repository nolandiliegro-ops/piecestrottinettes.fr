import { useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScooterModel } from "@/data/scooterData";
import useEmblaCarousel from "embla-carousel-react";

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

// Image mapping for scooter models
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
};

interface ScooterCarouselProps {
  models: ScooterModel[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

const ScooterCarousel = ({ models, activeIndex, onSelect }: ScooterCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  });

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        onSelect(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (emblaApi && activeIndex !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(activeIndex);
    }
  }, [emblaApi, activeIndex]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const activeModel = models[activeIndex] || models[0];

  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-lg text-muted-foreground text-center">
          Aucun modèle trouvé
        </p>
        <p className="text-sm text-muted-foreground/70 text-center mt-2">
          Essayez une autre recherche
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      {/* Arc Background */}
      <div className="absolute inset-0 arc-gradient pointer-events-none" />

      {/* Carousel */}
      <div className="relative w-full max-w-lg lg:max-w-xl overflow-hidden" ref={emblaRef}>
        <div className="flex items-center">
          {models.map((model, index) => {
            const isActive = index === activeIndex;
            const distance = Math.abs(index - activeIndex);
            const scale = isActive ? 1 : Math.max(0.6, 1 - distance * 0.15);
            const opacity = isActive ? 1 : Math.max(0.4, 1 - distance * 0.25);

            // Get the image from our mapping, fallback to model.image
            const imageSrc = scooterImages[model.id] || model.image;

            return (
              <div
                key={model.id}
                className="flex-shrink-0 w-full flex items-center justify-center px-4 transition-all duration-500"
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                }}
              >
                <div className="relative w-48 h-48 lg:w-64 lg:h-64 flex items-center justify-center">
                  {/* Scooter Image */}
                  <img
                    src={imageSrc}
                    alt={`${model.brand} ${model.name}`}
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          className="rounded-full w-10 h-10 border-foreground/20 hover:border-primary hover:bg-primary/10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Pagination Dots */}
        <div className="flex items-center gap-2">
          {models.slice(0, Math.min(5, models.length)).map((_, index) => (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeIndex 
                  ? "w-6 bg-primary" 
                  : "bg-foreground/20 hover:bg-foreground/40"
              }`}
            />
          ))}
          {models.length > 5 && (
            <span className="text-xs text-muted-foreground ml-1">+{models.length - 5}</span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          className="rounded-full w-10 h-10 border-foreground/20 hover:border-primary hover:bg-primary/10"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Active Model Info */}
      {activeModel && (
        <div className="mt-6 text-center animate-fade-in">
          <p className="text-sm text-muted-foreground font-medium tracking-wide">
            {activeModel.brand}
          </p>
          <h3 className="font-display text-3xl lg:text-4xl text-foreground mt-1">
            {activeModel.name}
          </h3>
          <p className="text-primary font-medium mt-2">
            {activeModel.compatibleParts} pièces compatibles
          </p>

          {/* CTA - Specific to selected model */}
          <Button 
            variant="outline"
            className="mt-4 rounded-full px-6 font-display text-lg tracking-wide gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
          >
            VOIR LES {activeModel.compatibleParts} PIÈCES
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScooterCarousel;
