import { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader2, Trophy, Package, ShoppingBag, Plus, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import GarageScooterCarousel from '@/components/garage/GarageScooterCarousel';
import TechnicalSpecs from '@/components/garage/TechnicalSpecs';
import DiagnosticStrip from '@/components/garage/DiagnosticStrip';
import ScooterIdentity from '@/components/garage/ScooterIdentity';
import ScooterDescriptionModal from '@/components/garage/ScooterDescriptionModal';
import ExpertTrackingWidget from '@/components/garage/ExpertTrackingWidget';
import OrderHistorySection from '@/components/garage/OrderHistorySection';
import CompatiblePartsGrid from '@/components/garage/CompatiblePartsGrid';
import PersonalDescription from '@/components/garage/PersonalDescription';
import GarageTimeline from '@/components/garage/GarageTimeline';
import QuickAddModificationDialog from '@/components/garage/QuickAddModificationDialog';
import GarageMessages from '@/components/garage/GarageMessages';
import { useUnreadMessagesCount } from '@/hooks/useOrderMessages';
import MediaSidebar from '@/components/garage/MediaSidebar';
import { useGarageScooters } from '@/hooks/useGarageScooters';
import { useUpdateNickname, useUpdatePersonalDescription } from '@/hooks/useGarage';
import { useCompatibleParts } from '@/hooks/useCompatibleParts';
import { cn } from '@/lib/utils';
import { getXPLevel, getProgressToNextLevel } from '@/lib/xpLevels';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Profile Identity Card
const ProfileIdentityCard = ({ user, profile }: { user: any; profile: any }) => {
  const points = profile?.performance_points || 0;
  const level = getXPLevel(points);
  const progress = getProgressToNextLevel(points);
  const displayName = profile?.display_name || 'Rider';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const LevelIcon = level.LucideIcon;

  // Count orders
  const { data: orderCount = 0 } = useQuery({
    queryKey: ['garage-order-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4 bg-white/60 backdrop-blur-xl border-[0.5px] border-mineral/20 rounded-2xl">
      {/* Avatar */}
      <div className={cn(
        "w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white font-display font-bold text-sm md:text-lg flex-shrink-0",
        level.level >= 4 ? "bg-gradient-to-br from-amber-500 to-yellow-400" :
        level.level >= 3 ? "bg-mineral" :
        level.level >= 2 ? "bg-blue-500" : "bg-slate-500"
      )}>
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-bold text-sm md:text-base text-carbon truncate">{displayName}</span>
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold", level.bgColor, level.color)}>
            <LevelIcon className="w-3 h-3" />
            {level.name}
          </span>
        </div>
        {/* XP Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-carbon/5 rounded-full overflow-hidden max-w-[160px]">
            <div 
              className={cn("h-full rounded-full transition-all duration-500", level.progressColor)} 
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="text-[10px] md:text-xs text-carbon/50 font-medium flex-shrink-0">
            {points.toLocaleString('fr-FR')} XP
          </span>
        </div>
      </div>

      {/* Order count */}
      <div className="hidden md:flex flex-col items-center px-4 border-l border-mineral/10">
        <span className="font-display font-bold text-lg text-carbon">{orderCount}</span>
        <span className="text-[10px] text-carbon/50 uppercase tracking-wider">Commandes</span>
      </div>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const { scooters, loading: scootersLoading, refetch: refetchScooters } = useGarageScooters();
  const [selectedScooter, setSelectedScooter] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'garage' | 'orders' | 'messages'>('garage');
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const updateNickname = useUpdateNickname();
  const updatePersonalDescription = useUpdatePersonalDescription();
  
  const { parts, loading: partsLoading } = useCompatibleParts(
    selectedScooter?.scooter_model?.id
  );
  const unreadCount = useUnreadMessagesCount();

  const scooterStats = calculateScooterStats(selectedScooter);

  // Handle scooter deletion — select next or clear
  const handleScooterDeleted = () => {
    refetchScooters();
    // After refetch, useEffect will pick the first available scooter
    setSelectedScooter(null);
  };

  // Handle nickname change
  const handleNicknameChange = (nickname: string) => {
    if (selectedScooter?.id) {
      updateNickname.mutate({ garageItemId: selectedScooter.id, nickname });
    }
  };

  useEffect(() => {
    if (scooters && scooters.length > 0 && !selectedScooter) {
      const scanModelSlug = searchParams.get("scan_model");
      if (scanModelSlug) {
        // Find the scooter matching the scan result
        const match = scooters.find((s: any) => s.scooter_model?.slug === scanModelSlug);
        if (match) {
          setSelectedScooter(match);
        } else {
          setSelectedScooter(scooters[0]);
        }
        // Clean up the URL
        searchParams.delete("scan_model");
        setSearchParams(searchParams, { replace: true });
      } else {
        setSelectedScooter(scooters[0]);
      }
    }
  }, [scooters, selectedScooter, searchParams, setSearchParams]);

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
      <SEO title="Mon Garage" description="Votre garage personnel" noindex />
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

              {/* Tab: Messages */}
              <button
                onClick={() => setActiveTab('messages')}
                className={cn(
                  "relative flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-full transition-all duration-300 min-h-[44px] flex-shrink-0",
                  activeTab === 'messages' 
                    ? "bg-carbon text-white" 
                    : "text-carbon/50 hover:text-carbon hover:bg-carbon/5"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="font-display text-xs md:text-sm tracking-wide">MESSAGES</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* Profile Identity Card */}
            <div className="flex items-center justify-end">
              <ProfileIdentityCard user={user} profile={profile} />
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
                      <div className="space-y-4 p-4 bg-white/40 backdrop-blur-md rounded-2xl border border-mineral/10">
                        <Skeleton className="w-full h-48 rounded-xl bg-mineral/5" />
                        <div className="space-y-2 px-2">
                          <Skeleton className="h-4 w-1/3 bg-mineral/5" />
                          <Skeleton className="h-6 w-2/3 bg-mineral/5" />
                          <Skeleton className="h-3 w-1/2 bg-mineral/5" />
                        </div>
                      </div>
                    ) : (
                      <GarageScooterCarousel 
                        scooters={scooters || []}
                        onScooterChange={setSelectedScooter}
                        onDelete={handleScooterDeleted}
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

                {/* ===== DESKTOP: 3-Column Dashboard ===== */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-6 shrink-0">
                  
                  {/* Column 1: Scooter Carousel + Identity + Description (5/12 = 42%) */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="col-span-5 flex flex-col gap-4"
                  >
                    {/* Scooter Carousel */}
                    <div className="min-h-[450px] max-h-[600px]">
                    {scootersLoading ? (
                        <div className="space-y-4 p-6 bg-white/40 backdrop-blur-md rounded-2xl border border-mineral/10 h-full">
                          <Skeleton className="w-full h-64 rounded-xl bg-mineral/5" />
                          <div className="space-y-3 px-2">
                            <Skeleton className="h-4 w-1/4 bg-mineral/5" />
                            <Skeleton className="h-7 w-3/5 bg-mineral/5" />
                            <Skeleton className="h-3 w-2/5 bg-mineral/5" />
                          </div>
                        </div>
                      ) : (
                        <GarageScooterCarousel 
                          scooters={scooters || []}
                          onScooterChange={setSelectedScooter}
                          onDelete={handleScooterDeleted}
                        />
                      )}
                    </div>
                    
                    {/* Identity under carousel */}
                    {selectedScooter?.scooter_model && (
                      <ScooterIdentity
                        brandName={selectedScooter.scooter_model.brand}
                        modelName={selectedScooter.scooter_model.name}
                        nickname={selectedScooter.nickname}
                        description={selectedScooter.scooter_model.description}
                        isOwned={selectedScooter.is_owned}
                        variant="desktop"
                        editable={true}
                        garageItemId={selectedScooter.id}
                        onNicknameChange={handleNicknameChange}
                        onReadMoreClick={() => setShowDescriptionModal(true)}
                      />
                    )}
                    
                    {/* Personal Description under identity */}
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
                      />
                    )}
                  </motion.div>

                  {/* Column 2: Technical Stats + Expert Tracking (4/12 = 33%) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="col-span-4 flex flex-col gap-3"
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

                    {/* Diagnostic Strip in column 2 */}
                    {selectedScooter?.scooter_model && (
                      <DiagnosticStrip
                        voltage={selectedScooter.scooter_model.voltage}
                        amperage={selectedScooter.scooter_model.amperage}
                        power={selectedScooter.scooter_model.power_watts}
                      />
                    )}
                  </motion.div>

                  {/* Column 3: Media Sidebar (3/12 = 25%) - STICKY */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="col-span-3"
                  >
                    {selectedScooter?.scooter_model && (
                      <MediaSidebar
                        scooterModelId={selectedScooter.scooter_model.id}
                        scooterName={scooterName}
                        userId={user?.id}
                        className="sticky top-24"
                      />
                    )}
                  </motion.div>
                </div>

                {/* Desktop: Modification Timeline (full width, below grid) */}
                {selectedScooter && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                    className="mt-8 shrink-0 hidden lg:block"
                  >
                    <GarageTimeline garageItemId={selectedScooter.id} />
                  </motion.div>
                )}

                {/* Desktop Bottom Row: Compatible Parts Carousel (full width) */}
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
            ) : activeTab === 'orders' ? (
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
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-y-auto pb-8"
              >
                <GarageMessages />
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
