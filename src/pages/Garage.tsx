import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader2, Trophy, Package, ShoppingBag, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GarageScooterCarousel from '@/components/garage/GarageScooterCarousel';
import TechnicalSpecs from '@/components/garage/TechnicalSpecs';
import DiagnosticStrip from '@/components/garage/DiagnosticStrip';
import ScooterVideoSection from '@/components/garage/ScooterVideoSection';
import ScooterIdentity from '@/components/garage/ScooterIdentity';
import ScooterDescriptionModal from '@/components/garage/ScooterDescriptionModal';
import ExpertTrackingWidget from '@/components/garage/ExpertTrackingWidget';
import OrderHistorySection from '@/components/garage/OrderHistorySection';
import CompatiblePartsGrid from '@/components/garage/CompatiblePartsGrid';
import PersonalDescription from '@/components/garage/PersonalDescription';
import GarageTimeline from '@/components/garage/GarageTimeline';
import QuickAddModificationDialog from '@/components/garage/QuickAddModificationDialog';
import { useGarageScooters } from '@/hooks/useGarageScooters';
import { useUpdateNickname, useUpdatePersonalDescription } from '@/hooks/useGarage';
import { useCompatibleParts } from '@/hooks/useCompatibleParts';
import { cn } from '@/lib/utils';
import { getXPLevel } from '@/lib/xpLevels';

// Compact Performance Widget for header - Mobile optimized
const CompactPerformanceWidget = ({ points, displayName }: { points: number; displayName: string }) => {
  const level = getXPLevel(points);

  return (
    <div className="flex items-center gap-1 md:gap-3 px-2 md:px-4 py-1 md:py-2 bg-white/60 backdrop-blur-xl border-[0.5px] border-mineral/20 rounded-full max-w-full">
      <Trophy className="w-3 h-3 md:w-4 md:h-4 text-mineral flex-shrink-0" />
      <span className={cn("font-display font-bold text-xs md:text-lg truncate", level.color)}>
        {points.toLocaleString('fr-FR')}
      </span>
      <span className="hidden md:inline text-xs text-carbon/50">XP</span>
      <div className="w-px h-3 md:h-4 bg-mineral/20 flex-shrink-0" />
      <span className={cn("text-[9px] md:text-xs font-semibold flex-shrink-0", level.color)}>
        <span className="md:hidden">LVL {level.level}</span>
        <span className="hidden md:inline">{level.name}</span>
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
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const updateNickname = useUpdateNickname();
  const updatePersonalDescription = useUpdatePersonalDescription();
  
  const { parts, loading: partsLoading } = useCompatibleParts(
    selectedScooter?.scooter_model?.id
  );

  const scooterStats = calculateScooterStats(selectedScooter);

  // Handle nickname change
  const handleNicknameChange = (nickname: string) => {
    if (selectedScooter?.id) {
      updateNickname.mutate({ garageItemId: selectedScooter.id, nickname });
    }
  };

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
        <div className="h-full flex flex-col max-w-[1920px] mx-auto w-full">
          
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
                className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide"
              >
                {/* ===== MOBILE: 7 VERTICAL BLOCKS ===== */}
                <div className="flex flex-col gap-6 lg:hidden">
                  
                  {/* Block 3: Identity - Brand | Model | Nickname */}
                  {selectedScooter?.scooter_model && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <ScooterIdentity
                        brandName={selectedScooter.scooter_model.brand}
                        modelName={selectedScooter.scooter_model.name}
                        nickname={selectedScooter.nickname}
                        description={selectedScooter.scooter_model.description}
                        isOwned={selectedScooter.is_owned}
                        variant="mobile"
                        editable={true}
                        garageItemId={selectedScooter.id}
                        onNicknameChange={handleNicknameChange}
                        onReadMoreClick={() => setShowDescriptionModal(true)}
                      />
                    </motion.div>
                  )}

                  {/* Personal Description - Mobile */}
                  {selectedScooter && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                    >
                      <PersonalDescription
                        garageItemId={selectedScooter.id}
                        initialDescription={selectedScooter.personal_description || null}
                        onUpdate={async (description) => {
                          await updatePersonalDescription.mutateAsync({
                            garageItemId: selectedScooter.id,
                            description,
                          });
                        }}
                      />
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
                  
                  {/* Block 7: Modification Timeline - Mobile (BEFORE parts) */}
                  {selectedScooter && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <GarageTimeline garageItemId={selectedScooter.id} />
                    </motion.div>
                  )}
                  
                  {/* Block 8: Inventory - Pièces Compatibles Carousel */}
                  {selectedScooter && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.35 }}
                    >
                      <CompatiblePartsGrid
                        scooterId={selectedScooter.scooter_model?.id || selectedScooter.id}
                        scooterName={scooterName}
                        parts={parts || []}
                        loading={partsLoading}
                      />
                    </motion.div>
                  )}
                </div>

                {/* ===== DESKTOP: Original Bento Grid ===== */}
                <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-6 shrink-0">
                  {/* Left Column: Scooter Image */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="lg:col-span-2 min-h-[400px] max-h-[500px]"
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

                    {/* ScooterVideoSection - Academy Link */}
                    {selectedScooter?.scooter_model && (
                      <ScooterVideoSection
                        scooterModelId={selectedScooter.scooter_model.id}
                        scooterName={scooterName}
                        className="shrink-0 flex-1 min-h-[120px]"
                      />
                    )}

                    {/* Personal Description - Desktop */}
                    {selectedScooter && (
                      <PersonalDescription
                        garageItemId={selectedScooter.id}
                        initialDescription={selectedScooter.personal_description || null}
                        onUpdate={async (description) => {
                          await updatePersonalDescription.mutateAsync({
                            garageItemId: selectedScooter.id,
                            description,
                          });
                        }}
                        className="shrink-0"
                      />
                    )}
                  </motion.div>
                </div>

                {/* Desktop: Modification Timeline (BEFORE parts carousel) */}
                {selectedScooter && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-8 shrink-0 hidden lg:block"
                  >
                    <GarageTimeline garageItemId={selectedScooter.id} />
                  </motion.div>
                )}

                {/* Desktop Bottom Row: Compatible Parts Carousel */}
                {selectedScooter && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="mt-8 shrink-0 hidden lg:block pb-8"
                  >
                    <CompatiblePartsGrid
                      scooterId={selectedScooter.scooter_model?.id || selectedScooter.id}
                      scooterName={scooterName}
                      parts={parts || []}
                      loading={partsLoading}
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

      {/* Scooter Description Modal */}
      {selectedScooter?.scooter_model && (
        <ScooterDescriptionModal
          isOpen={showDescriptionModal}
          onClose={() => setShowDescriptionModal(false)}
          scooterName={selectedScooter.scooter_model.name}
          brandName={selectedScooter.scooter_model.brand}
          description={selectedScooter.scooter_model.description || ''}
          specs={{
            power_watts: selectedScooter.scooter_model.power_watts,
            range_km: selectedScooter.scooter_model.range_km,
            max_speed_kmh: selectedScooter.scooter_model.max_speed_kmh,
            voltage: selectedScooter.scooter_model.voltage,
          }}
        />
      )}

      {/* Floating Action Button - Quick Add Modification */}
      {activeTab === 'garage' && scooters && scooters.length > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setQuickAddOpen(true)}
          className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14 
                   bg-mineral text-white rounded-full shadow-2xl 
                   flex items-center justify-center z-40
                   hover:bg-mineral/90 transition-colors
                   hover:shadow-[0_0_30px_rgba(147,181,161,0.4)]"
          title="Ajouter une modification"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Quick Add Modification Dialog */}
      <QuickAddModificationDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
      />
    </div>
  );
};

export default Garage;
