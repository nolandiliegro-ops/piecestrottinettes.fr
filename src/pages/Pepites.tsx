import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturedPartCard from "@/components/pepites/FeaturedPartCard";
import { Skeleton } from "@/components/ui/skeleton";

const Pepites = () => {
  const { data: featuredParts, isLoading } = useQuery({
    queryKey: ['featured-parts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div 
      className="min-h-screen bg-greige pb-24 md:pb-0"
      style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)'
      }}
    >
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Background texture */}
          <div className="absolute inset-0 bg-gradient-to-b from-carbon/5 via-transparent to-transparent" />
          
          {/* Decorative elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute top-20 right-10 w-96 h-96 bg-mineral rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.08, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            className="absolute bottom-20 left-10 w-64 h-64 bg-mineral rounded-full blur-3xl"
          />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Trophy Icon */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex justify-center mb-8"
              >
                <div className="w-20 h-20 rounded-2xl bg-mineral/15 flex items-center justify-center backdrop-blur-sm border border-mineral/20">
                  <Trophy className="w-10 h-10 text-mineral" />
                </div>
              </motion.div>
              
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-display text-5xl md:text-7xl lg:text-8xl text-carbon mb-6 cursor-pointer title-underline-animated"
                style={{
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                }}
              >
                LES PÉPITES
              </motion.h1>
              
              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light"
              >
                Notre sélection exclusive de pièces premium, choisies par nos experts 
                pour leur qualité exceptionnelle et leurs performances remarquables.
              </motion.p>
              
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 bg-mineral/15 rounded-full border border-mineral/20"
              >
                <Sparkles className="w-4 h-4 text-mineral" />
                <span className="text-sm font-medium text-mineral tracking-wide">
                  SÉLECTION COUP DE CŒUR
                </span>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Featured Parts Grid */}
        <section className="pb-24 px-4">
          <div className="container mx-auto">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[3/4] rounded-2xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-8 w-1/2" />
                  </div>
                ))}
              </div>
            ) : featuredParts && featuredParts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {featuredParts.map((part, index) => (
                  <FeaturedPartCard key={part.id} part={part} index={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-mineral/10 flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-mineral/40" />
                </div>
                <h3 className="font-display text-2xl text-carbon mb-3">
                  Aucune pépite disponible
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Notre équipe prépare une sélection exceptionnelle pour vous. 
                  Revenez bientôt découvrir nos coups de cœur.
                </p>
              </motion.div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pepites;
