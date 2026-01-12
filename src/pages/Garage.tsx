import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Loader2, Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import GarageScooterCarousel from '@/components/garage/GarageScooterCarousel';
import TechnicalSpecs from '@/components/garage/TechnicalSpecs';
import MaintenanceLog from '@/components/garage/MaintenanceLog';
import ScooterVideoSection from '@/components/garage/ScooterVideoSection';
import ProductsUsed from '@/components/garage/ProductsUsed';
import { useGarageScooters } from '@/hooks/useGarageScooters';
import { useCompatibleParts } from '@/hooks/useCompatibleParts';
import { cn } from '@/lib/utils';

// Compact Performance Widget for header
const CompactPerformanceWidget = ({ points, displayName }: { points: number; displayName: string }) => {
  const getLevel = (pts: number) => {
    if (pts >= 1000) return { label: 'EXPERT', color: 'text-amber-500' };
    if (pts >= 500) return { label: 'AVANCÉ', color: 'text-mineral' };
    if (pts >= 100) return { label: 'INTER', color: 'text-blue-500' };
    return { label: 'DÉBUT', color: 'text-slate-500' };
  };
  const level = getLevel(points);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white/60 border border-mineral/20 rounded-full">
      <Trophy className="w-4 h-4 text-mineral" />
      <span className={cn("font-display font-bold text-lg", level.color)}>
        {points.toLocaleString('fr-FR')}
      </span>
      <span className="text-xs text-carbon/50">pts</span>
      <div className="w-px h-4 bg-mineral/20" />
      <span className={cn("text-xs font-semibold", level.color)}>{level.label}</span>
    </div>
  );
};

const Garage = () => {
  const { profile, loading: authLoading } = useAuth();
  const { scooters, loading: scootersLoading } = useGarageScooters();
  const [selectedScooter, setSelectedScooter] = useState<any>(null);
  
  // Fetch compatible parts for selected scooter
  const { parts, loading: partsLoading } = useCompatibleParts(
    selectedScooter?.scooter_model?.id
  );

  // Set initial selected scooter when scooters load
  useEffect(() => {
    if (scooters && scooters.length > 0 && !selectedScooter) {
      setSelectedScooter(scooters[0]);
    }
  }, [scooters, selectedScooter]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-greige flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-mineral" />
      </div>
    );
  }

  const scooterName = selectedScooter 
    ? `${selectedScooter.scooter_model.brand} ${selectedScooter.scooter_model.name}`
    : '';

  return (
    <div className="h-screen bg-greige flex flex-col overflow-hidden">
      <Header />
      
      {/* Main Content - Zero Scroll Layout */}
      <main className="flex-1 pt-20 lg:pt-24 px-4 lg:px-6 pb-4 overflow-hidden">
        <div className="h-full flex flex-col max-w-7xl mx-auto">
          
          {/* Header Row - Compact */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between mb-4 shrink-0"
          >
            <div>
              <h1 className="font-display text-2xl lg:text-3xl text-carbon tracking-wide">
                MON GARAGE
              </h1>
              <p className="text-carbon/60 text-sm">
                Bienvenue, <span className="text-mineral font-medium">{profile?.display_name || 'Rider'}</span>
              </p>
            </div>
            <CompactPerformanceWidget 
              points={profile?.performance_points || 0}
              displayName={profile?.display_name || 'Rider'}
            />
          </motion.div>

          {/* Main Bento Grid - Takes remaining space */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
            
            {/* Left Column: Scooter Image (2/3 width) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-2 min-h-0"
            >
              {scootersLoading ? (
                <div className="flex items-center justify-center h-full bg-white/40 rounded-2xl">
                  <Loader2 className="w-8 h-8 animate-spin text-mineral" />
                </div>
              ) : (
                <GarageScooterCarousel 
                  scooters={scooters || []}
                  onScooterChange={setSelectedScooter}
                />
              )}
            </motion.div>

            {/* Right Column: Stacked Info (1/3 width) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col gap-3 min-h-0 overflow-hidden"
            >
              {/* Technical Specs */}
              {selectedScooter && (
                <TechnicalSpecs
                  voltage={selectedScooter.scooter_model.voltage}
                  amperage={selectedScooter.scooter_model.amperage}
                  power={selectedScooter.scooter_model.power_watts}
                  className="shrink-0"
                />
              )}

              {/* Maintenance Log - Scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <MaintenanceLog 
                  selectedScooter={selectedScooter}
                  className="h-full"
                />
              </div>

              {/* YouTube Video - Fixed Height */}
              {selectedScooter && (
                <ScooterVideoSection
                  youtubeVideoId={selectedScooter.scooter_model.youtube_video_id}
                  scooterName={scooterName}
                  className="shrink-0 h-36"
                />
              )}
            </motion.div>
          </div>

          {/* Bottom Row: Compatible Parts - Horizontal Scroll */}
          {selectedScooter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-4 shrink-0"
            >
              <CompactProductsRow
                scooterId={selectedScooter.id}
                scooterName={scooterName}
                parts={parts || []}
                loading={partsLoading}
              />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

// Compact horizontal products row
interface Part {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock_quantity: number;
  category: { name: string };
}

const CompactProductsRow = ({ 
  scooterId, 
  scooterName, 
  parts, 
  loading 
}: { 
  scooterId: string; 
  scooterName: string; 
  parts: Part[]; 
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="h-28 flex items-center justify-center bg-white/40 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-mineral" />
      </div>
    );
  }

  if (!parts || parts.length === 0) {
    return (
      <div className="h-28 flex items-center justify-center bg-white/40 border border-mineral/20 rounded-xl">
        <p className="text-carbon/40 text-sm">Aucune pièce compatible</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm text-carbon uppercase tracking-wide">
          Pièces compatibles
        </h3>
        <span className="text-xs text-carbon/50">{parts.length} disponibles</span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-mineral/20 scrollbar-track-transparent">
        {parts.slice(0, 10).map((part, index) => (
          <motion.div
            key={part.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            className="flex-shrink-0 w-32 bg-white/60 border border-mineral/20 rounded-xl p-2 hover:shadow-md hover:border-mineral/40 transition-all cursor-pointer"
          >
            {/* Image */}
            <div className="aspect-square rounded-lg bg-greige/30 overflow-hidden mb-2">
              {part.image ? (
                <img
                  src={part.image}
                  alt={part.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-carbon/20 text-2xl">
                  📦
                </div>
              )}
            </div>
            
            {/* Info */}
            <p className="text-xs font-medium text-carbon line-clamp-1">{part.name}</p>
            <p className="text-sm font-bold text-mineral">{part.price?.toFixed(0)}€</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Garage;
