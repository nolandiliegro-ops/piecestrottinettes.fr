import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface PremiumCarouselProps {
  children: React.ReactNode;
  itemsCount: number;
  onSlideChange?: (index: number) => void;
  className?: string;
}

const PremiumCarousel = ({
  children,
  itemsCount,
  onSlideChange,
  className,
}: PremiumCarouselProps) => {
  const isMobile = useIsMobile();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    slidesToScroll: 1,
    containScroll: false,
    dragFree: isMobile,
  });

  const scrollPrev = React.useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = React.useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    onSlideChange?.(index);
  }, [emblaApi, onSlideChange]);

  React.useEffect(() => {
    if (!emblaApi) return;
    
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Calculate distance from center for each child
  const childrenWithProps = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;
    
    const distanceFromCenter = Math.abs(index - selectedIndex);
    const wrappedDistance = Math.min(
      distanceFromCenter,
      itemsCount - distanceFromCenter
    );
    
    return React.cloneElement(child as React.ReactElement<any>, {
      distanceFromCenter: wrappedDistance,
      isCenter: wrappedDistance === 0,
    });
  });

  // Limit visible dots
  const maxDots = isMobile ? 6 : 12;
  const visibleDots = scrollSnaps.slice(0, maxDots);

  return (
    <div className={cn("relative premium-carousel-container", className)}>
      {/* Main Carousel */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-4 lg:gap-6">
          {React.Children.map(childrenWithProps, (child, index) => (
            <div
              key={index}
              className={cn(
                "flex-shrink-0 transition-all duration-500",
                // Responsive widths
                "w-[70vw] md:w-[33%] lg:w-[20%]"
              )}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <motion.button
        onClick={scrollPrev}
        className={cn(
          "absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-20",
          "w-10 h-10 lg:w-12 lg:h-12 rounded-full",
          "flex items-center justify-center",
          "carousel-nav-btn",
          isMobile && "w-9 h-9"
        )}
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(147, 181, 161, 0.3)",
          boxShadow: "0 4px 20px rgba(26, 26, 26, 0.1)",
        }}
        whileHover={{ 
          scale: 1.1,
          boxShadow: "0 8px 30px rgba(147, 181, 161, 0.4)",
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-carbon" />
      </motion.button>

      <motion.button
        onClick={scrollNext}
        className={cn(
          "absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-20",
          "w-10 h-10 lg:w-12 lg:h-12 rounded-full",
          "flex items-center justify-center",
          "carousel-nav-btn",
          isMobile && "w-9 h-9"
        )}
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(147, 181, 161, 0.3)",
          boxShadow: "0 4px 20px rgba(26, 26, 26, 0.1)",
        }}
        whileHover={{ 
          scale: 1.1,
          boxShadow: "0 8px 30px rgba(147, 181, 161, 0.4)",
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-carbon" />
      </motion.button>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {visibleDots.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "rounded-full transition-all duration-300 ease-out",
              index === selectedIndex
                ? "w-8 h-2 bg-mineral"
                : "w-2 h-2 bg-mineral/30 hover:bg-mineral/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
        {scrollSnaps.length > maxDots && (
          <span className="text-xs text-muted-foreground ml-2">
            +{scrollSnaps.length - maxDots}
          </span>
        )}
      </div>
    </div>
  );
};

export default PremiumCarousel;
