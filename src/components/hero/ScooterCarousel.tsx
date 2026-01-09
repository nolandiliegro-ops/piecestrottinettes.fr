import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScooterModel } from "@/data/scooterData";
import useEmblaCarousel from "embla-carousel-react";

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
                    src={model.image}
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

          {/* CTA */}
          <Button 
            className="mt-4 rounded-full px-6 font-display text-lg tracking-wide gap-2"
          >
            Découvrir les pièces
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScooterCarousel;
