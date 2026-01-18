import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Filter, X, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TutorialCard from "@/components/tutos/TutorialCard";
import VideoModal from "@/components/tutos/VideoModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Tutorial {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  youtube_video_id: string;
  difficulty: number;
  duration_minutes: number;
  scooter_model_id: string | null;
  scooter?: {
    name: string;
    slug: string;
    brand?: {
      name: string;
    } | null;
  } | null;
}

interface ScooterModel {
  id: string;
  name: string;
  slug: string;
  brand: {
    name: string;
  } | null;
}

const Tutos = () => {
  const [selectedScooter, setSelectedScooter] = useState<string | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch scooter models for filter
  const { data: scooters } = useQuery({
    queryKey: ['scooter-models-for-tutos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scooter_models')
        .select('id, name, slug, brand:brands(name)')
        .order('name');
      
      if (error) throw error;
      return data as ScooterModel[];
    }
  });

  // Fetch tutorials with optional scooter filter
  const { data: tutorials, isLoading } = useQuery({
    queryKey: ['tutorials', selectedScooter],
    queryFn: async () => {
      let query = supabase
        .from('tutorials')
        .select('*, scooter:scooter_models(name, slug, brand:brands(name))')
        .order('created_at', { ascending: false });
      
      if (selectedScooter) {
        query = query.eq('scooter_model_id', selectedScooter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Tutorial[];
    }
  });

  const handleTutorialClick = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTutorial(null), 300);
  };

  const handleScooterChange = (value: string) => {
    setSelectedScooter(value === 'all' ? null : value);
  };

  return (
    <div 
      className="min-h-screen bg-greige pb-24 md:pb-0"
      style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)'
      }}
    >
      <Header />
      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-gradient-to-b from-greige to-background pt-24 pb-16 lg:pt-32 lg:pb-20"
      >
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mineral/15 border border-mineral/20 mb-6">
              <GraduationCap className="w-4 h-4 text-mineral" />
              <span className="text-sm font-medium text-mineral tracking-wide uppercase">
                Formation Technique
              </span>
            </div>
            
            {/* Title */}
            <h1 className="font-display text-5xl md:text-7xl text-carbon tracking-[0.15em] mb-4">
              THE ACADEMY
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg text-carbon/60 max-w-2xl mx-auto">
              Apprenez à entretenir et réparer votre trottinette avec nos tutoriels experts
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Filter Bar */}
      <div className="sticky top-16 lg:top-20 z-40 bg-background/80 backdrop-blur-md border-b border-border/30 py-4">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex items-center gap-4 flex-wrap"
          >
            <Filter className="w-4 h-4 text-mineral" />
            <span className="text-sm text-carbon/70">Filtrer par modèle :</span>
            
            <Select value={selectedScooter || 'all'} onValueChange={handleScooterChange}>
              <SelectTrigger className="w-64 bg-white/60 border-mineral/20 focus:ring-mineral/30">
                <SelectValue placeholder="Tous les modèles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modèles</SelectItem>
                {scooters?.map((scooter) => (
                  <SelectItem key={scooter.id} value={scooter.id}>
                    {scooter.brand?.name} {scooter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <AnimatePresence>
              {selectedScooter && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedScooter(null)}
                    className="text-carbon/60 hover:text-carbon"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Réinitialiser
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Tutorials Grid */}
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/40 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-carbon/10" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-carbon/10 rounded w-1/3" />
                  <div className="h-6 bg-carbon/10 rounded w-full" />
                  <div className="h-4 bg-carbon/10 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : tutorials && tutorials.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {tutorials.map((tutorial, index) => (
                <TutorialCard
                  key={tutorial.id}
                  tutorial={tutorial}
                  index={index}
                  onClick={() => handleTutorialClick(tutorial)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-mineral/10 flex items-center justify-center mb-6">
              <Wrench className="w-10 h-10 text-mineral/50" />
            </div>
            <h3 className="font-display text-2xl text-carbon/70 tracking-wide mb-2">
              ACADEMY EN CONSTRUCTION
            </h3>
            <p className="text-carbon/50 max-w-md">
              {selectedScooter 
                ? "Aucun tutoriel disponible pour ce modèle. Essayez un autre filtre !"
                : "Nos experts préparent de nouveaux tutoriels. Revenez bientôt !"}
            </p>
          </motion.div>
        )}
      </div>

      {/* Video Modal */}
      <VideoModal
        tutorial={selectedTutorial}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <Footer />
    </div>
  );
};

export default Tutos;
