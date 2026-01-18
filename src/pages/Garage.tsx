import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader2, Trophy, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GarageScooterCarousel from '@/components/garage/GarageScooterCarousel';
import TechnicalSpecs from '@/components/garage/TechnicalSpecs';
import DiagnosticStrip from '@/components/garage/DiagnosticStrip';
import ScooterVideoSection from '@/components/garage/ScooterVideoSection';
import ExpertTrackingWidget from '@/components/garage/ExpertTrackingWidget';
import OrderHistorySection from '@/components/garage/OrderHistorySection';
import { useGarageScooters } from '@/hooks/useGarageScooters';
import { useCompatibleParts } from '@/hooks/useCompatibleParts';
import { cn } from '@/lib/utils';

// Compact Performance Widget for header - Mobile optimized
const CompactPerformanceWidget = ({ points, displayName }: { points: number; displayName: string }) => {
  const getLevel = (pts: number) => {
    if (pts >= 1000) return { label: 'EXP', fullLabel: 'EXPERT', color: 'text-amber-500' };
    if (pts >= 500) return { label: 'AVA', fullLabel: 'AVANCÉ', color: 'text-mineral' };
    if (pts >= 100) return { label: 'INT', fullLabel: 'INTER', color: 'text-blue-500' };
    return { label: 'DÉB', fullLabel: 'DÉBUT', color: 'text-slate-500' };
  };
  const level = getLevel(points);

  return (
    <div className="flex items-center gap-1 md:gap-3 px-2 md:px-4 py-1 md:py-2 bg-white/60 backdrop-blur-xl border-[0.5px] border-mineral/20 rounded-full max-w-full">
      <Trophy className="w-3 h-3 md:w-4 md:h-4 text-mineral flex-shrink-0" />
      <span className={cn("font-display font-bold text-xs md:text-lg truncate", level.color)}>
        {points.toLocaleString('fr-FR')}
      </span>
      <span className="hidden md:inline text-xs text-carbon/50">pts</span>
      <div className="w-px h-3 md:h-4 bg-mineral/20 flex-shrink-0" />
      <span className={cn("text-[9px] md:text-xs font-semibold flex-shrink-0", level.color)}>
        <span className="md:hidden">{level.label}</span>
        <span className="hidden md:inline">{level.fullLabel}</span>
      </span>
    </div>
  );
};

// Calculate dynamic scooter stats based on specs
const calculateScooterStats = (scooter: any) => {
  if (!scooter?.scooter_model) {
    return { totalInvested: 0, machinePoints: 0 };
  }
  
  const model = scooter.scooter_model;
  
  const powerPoints = Math.round((model.power_watts || 500) / 20);
  const rangePoints = Math.round((model.range_km || 20) * 2);
  const partsBonus = (model.compatible_parts_count || 0) * 3;
  const machinePoints = powerPoints + rangePoints + partsBonus;
  
  const avgPartPrice = 35;
  const powerTier = model.power_watts ? (model.power_watts > 2000 ? 1.5 : model.power_watts > 1000 ? 1.2 : 1) : 1;
  const estimatedParts = Math.round((model.compatible_parts_count || 5) * 0.3);
  const totalInvested = Math.round(estimatedParts * avgPartPrice * powerTier);
  
  return { totalInvested, machinePoints };
};

const Garage = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { scooters, loading: scootersLoading, refetch: refetchScooters } = useGarageScooters();
  const [selectedScooter, setSelectedScooter] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'garage' | 'orders'>('garage');
  
  const { parts, loading: partsLoading } = useCompatibleParts(
    selectedScooter?.scooter_model?.id
  );

  const scooterStats = calculateScooterStats(selectedScooter);

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
    <div className="h-screen flex flex-col overflow-hidden overflow-x-hidden studio-luxury-bg watermark-brand pb-24 md:pb-0">
      <Header />
      
      <main className="flex-1 pt-20 lg:pt-24 px-4 lg:px-6 pb-4 overflow-hidden">
        <div className="h-full flex flex-col max-w-7xl mx-auto">
          
          {/* Header Row with Tabs - Stacks on mobile */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mb-4 shrink-0"
          >
            {/* Tabs - Full width scroll on mobile */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {/* Tab: Mon Garage */}
              <button
                onClick={() => setActiveTab('garage')}
                className={cn(
                  "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-full transition-all duration-300 min-h-[44px] flex-shrink-0",
                  activeTab === 'garage' 
                    ? "bg-carbon text-white" 
                    : "text-carbon/50 hover:text-carbon hover:bg-carbon/5"
                )}
              >
                <Package className="w-4 h-4" />
                <span className="font-display text-xs md:text-sm tracking-wide">GARAGE</span>
              </button>
              
              {/* Tab: Mes Commandes */}
              <button
                onClick={() => setActiveTab('orders')}
                className={cn(
                  "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-full transition-all duration-300 min-h-[44px] flex-shrink-0",
                  activeTab === 'orders' 
                    ? "bg-carbon text-white" 
                    : "text-carbon/50 hover:text-carbon hover:bg-carbon/5"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="font-display text-xs md:text-sm tracking-wide">COMMANDES</span>
              </button>
            </div>
            
            {/* User info - Ultra compact on mobile */}
            <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 min-w-0 max-w-full">
              <p className="text-carbon/60 text-xs md:text-sm truncate min-w-0">
                <span className="text-mineral font-medium">{profile?.display_name || 'Rider'}</span>
              </p>
              <CompactPerformanceWidget 
                points={profile?.performance_points || 0}
                displayName={profile?.display_name || 'Rider'}
              />
            </div>
          </motion.div>

          {/* Tab Content with Animation */}
          <AnimatePresence mode="wait">
            {activeTab === 'garage' ? (
              <motion.div
                key="garage"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-mineral/20"
              >
                {/* ===== MOBILE: 7 VERTICAL BLOCKS ===== */}
                <div className="flex flex-col gap-6 lg:hidden">
                  
                  {/* Block 3: Title - Scooter Name */}
                  {selectedScooter?.scooter_model && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="text-center"
                    >
                      <h1 className="font-display text-xl font-bold text-carbon tracking-tight uppercase">
                        {scooterName}
                      </h1>
                    </motion.div>
                  )}
                  
                  {/* Block 4: Hero - Scooter Image (Clean, no floating text) */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                  >
                    {scootersLoading ? (
                      <div className="flex items-center justify-center h-64 bg-white/40 rounded-2xl">
                        <Loader2 className="w-8 h-8 animate-spin text-mineral" />
                      </div>
                    ) : (
                      <GarageScooterCarousel 
                        scooters={scooters || []}
                        onScooterChange={setSelectedScooter}
                        mobileCleanMode={true}
                      />
                    )}
                  </motion.div>
                  
                  {/* Block 6: Diagnostic Strip */}
                  {selectedScooter?.scooter_model && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.25 }}
                    >
                      <DiagnosticStrip
                        voltage={selectedScooter.scooter_model.voltage}
                        amperage={selectedScooter.scooter_model.amperage}
                        power={selectedScooter.scooter_model.power_watts}
                      />
                    </motion.div>
                  )}
                  
                  {/* Block 7: Inventory - Pièces Compatibles */}
                  {selectedScooter && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
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

                {/* ===== DESKTOP: Original Bento Grid ===== */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-4 min-h-0 max-w-full flex-1">
                  {/* Left Column: Scooter Image */}
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

                  {/* Right Column: Stacked Info */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex flex-col gap-3 min-h-0 overflow-hidden"
                  >
                    {selectedScooter?.scooter_model && (
                      <TechnicalSpecs
                        voltage={selectedScooter.scooter_model.voltage}
                        amperage={selectedScooter.scooter_model.amperage}
                        power={selectedScooter.scooter_model.power_watts}
                        className="shrink-0"
                      />
                    )}

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

                    {selectedScooter?.scooter_model && (
                      <ScooterVideoSection
                        youtubeVideoId={selectedScooter.scooter_model.youtube_video_id}
                        scooterName={scooterName}
                        className="shrink-0 flex-1 min-h-[120px]"
                      />
                    )}
                  </motion.div>
                </div>

                {/* Desktop Bottom Row: Compatible Parts */}
                {selectedScooter && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-4 shrink-0 hidden lg:block"
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
              </motion.div>
            ) : (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-y-auto pb-8"
              >
                <OrderHistorySection userId={user?.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Footer />
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
            onClick={() => onViewPart(part.id)}
            className="flex-shrink-0 w-36 bg-white/80 border border-carbon/10 rounded-xl p-3 
                       hover:shadow-lg hover:border-mineral/40 transition-all cursor-pointer group"
          >
            <div className="aspect-square rounded-lg bg-greige overflow-hidden mb-2 flex items-center justify-center">
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
            
            <p className="text-xs font-medium text-carbon line-clamp-2 mb-1 min-h-[2rem]">
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
