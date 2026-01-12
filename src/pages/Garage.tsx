import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Loader2, Trophy, Package, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import GarageScooterCarousel from '@/components/garage/GarageScooterCarousel';
import TechnicalSpecs from '@/components/garage/TechnicalSpecs';
import MaintenanceLog from '@/components/garage/MaintenanceLog';
import ScooterVideoSection from '@/components/garage/ScooterVideoSection';
import ExpertTrackingWidget from '@/components/garage/ExpertTrackingWidget';
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

// Calculate dynamic scooter stats based on specs
const calculateScooterStats = (scooter: any) => {
  if (!scooter?.scooter_model) {
    return { totalInvested: 0, machinePoints: 0 };
  }
  
  const model = scooter.scooter_model;
  
  // Points: Based on power + range + compatible parts
  const powerPoints = Math.round((model.power_watts || 500) / 20);
  const rangePoints = Math.round((model.range_km || 20) * 2);
  const partsBonus = (model.compatible_parts_count || 0) * 3;
  const machinePoints = powerPoints + rangePoints + partsBonus;
  
  // Investment: Estimated based on parts count and power tier
  const avgPartPrice = 35;
  const powerTier = model.power_watts ? (model.power_watts > 2000 ? 1.5 : model.power_watts > 1000 ? 1.2 : 1) : 1;
  const estimatedParts = Math.round((model.compatible_parts_count || 5) * 0.3); // Assume 30% purchased
  const totalInvested = Math.round(estimatedParts * avgPartPrice * powerTier);
  
  return { totalInvested, machinePoints };
};

const Garage = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { scooters, loading: scootersLoading, refetch: refetchScooters } = useGarageScooters();
  const [selectedScooter, setSelectedScooter] = useState<any>(null);
  
  // Fetch compatible parts for selected scooter
  const { parts, loading: partsLoading } = useCompatibleParts(
    selectedScooter?.scooter_model?.id
  );

  // Calculate dynamic stats for selected scooter
  const scooterStats = calculateScooterStats(selectedScooter);

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

  const scooterName = selectedScooter?.scooter_model 
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
              {selectedScooter?.scooter_model && (
                <TechnicalSpecs
                  voltage={selectedScooter.scooter_model.voltage}
                  amperage={selectedScooter.scooter_model.amperage}
                  power={selectedScooter.scooter_model.power_watts}
                  className="shrink-0"
                />
              )}

              {/* Expert Tracking Widget - Dynamic Data */}
              {selectedScooter && (
                <ExpertTrackingWidget
                  garageItemId={selectedScooter.id}
                  scooterName={scooterName}
                  lastMaintenanceDate={selectedScooter.last_maintenance_date}
                  totalInvested={scooterStats.totalInvested}
                  machinePoints={scooterStats.machinePoints}
                  className="shrink-0"
                />
              )}

              {/* YouTube Video - Fixed Height */}
              {selectedScooter?.scooter_model && (
                <ScooterVideoSection
                  youtubeVideoId={selectedScooter.scooter_model.youtube_video_id}
                  scooterName={scooterName}
                  className="shrink-0 flex-1 min-h-[120px]"
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
                onViewPart={(partId) => navigate(`/part/${partId}`)}
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
  loading,
  onViewPart
}: { 
  scooterId: string; 
  scooterName: string; 
  parts: Part[]; 
  loading: boolean;
  onViewPart: (partId: string) => void;
}) => {
  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center bg-white/40 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-mineral" />
      </div>
    );
  }

  if (!parts || parts.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center bg-white/40 border border-mineral/20 rounded-xl">
        <p className="text-carbon/40 text-sm">Aucune pièce compatible</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm text-[#1A1A1A] uppercase tracking-wide">
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
            onClick={() => onViewPart(part.id)}
            className="flex-shrink-0 w-36 bg-white/80 border border-mineral/20 rounded-xl p-3 
                       hover:shadow-lg hover:border-mineral/40 transition-all cursor-pointer group"
          >
            {/* Image - Luxury Studio Style */}
            <div className="aspect-square rounded-lg bg-[#F9F8F6] overflow-hidden mb-2 flex items-center justify-center">
              {part.image ? (
                <img
                  src={part.image}
                  alt={part.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-carbon/30" />
                </div>
              )}
            </div>
            
            {/* Info with Carbon Black text */}
            <p className="text-xs font-medium text-[#1A1A1A] line-clamp-2 mb-1 min-h-[2rem]">
              {part.name}
            </p>
            
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-mineral">{part.price?.toFixed(0)}€</p>
              <span className="text-[10px] text-mineral font-medium flex items-center gap-0.5 
                             opacity-0 group-hover:opacity-100 transition-opacity">
                Voir <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Garage;
