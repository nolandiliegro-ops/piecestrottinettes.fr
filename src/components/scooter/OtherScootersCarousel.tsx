import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ScooterModelCard from "@/components/scooters/ScooterModelCard";
import { useScooterModels } from "@/hooks/useScooterData";

interface OtherScootersCarouselProps {
  currentScooterId: string;
}

const OtherScootersCarousel = ({ currentScooterId }: OtherScootersCarouselProps) => {
  const { data: allScooters, isLoading } = useScooterModels();

  // Filter out the current scooter
  const otherScooters = allScooters?.filter((s) => s.id !== currentScooterId) || [];

  if (isLoading) {
    return (
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="h-10 w-80 bg-muted/50 rounded animate-pulse" />
            <div className="h-10 w-48 bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-muted/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (otherScooters.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-transparent to-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header with Title + CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-10"
        >
          <h2 className="font-display text-3xl lg:text-4xl xl:text-5xl text-foreground uppercase tracking-wide">
            VOIR LES AUTRES TROTTINETTES
          </h2>
          <Link to="/trottinettes">
            <Button
              variant="outline"
              className="gap-2 border-mineral/30 hover:bg-mineral hover:text-white transition-all duration-300"
            >
              Voir tout le catalogue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {otherScooters.map((scooter, index) => (
                <CarouselItem
                  key={scooter.id}
                  className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                >
                  <ScooterModelCard scooter={scooter} index={index} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4 lg:-left-6 bg-white/90 backdrop-blur-sm border-mineral/20 hover:bg-mineral hover:text-white transition-all" />
            <CarouselNext className="hidden md:flex -right-4 lg:-right-6 bg-white/90 backdrop-blur-sm border-mineral/20 hover:bg-mineral hover:text-white transition-all" />
          </Carousel>
        </motion.div>
      </div>
    </section>
  );
};

export default OtherScootersCarousel;
