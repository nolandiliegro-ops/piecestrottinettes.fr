import SEO from "@/components/SEO";
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Loader2, Plus, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GarageScooterCarousel from '@/components/garage/GarageScooterCarousel';
import ScooterDescriptionModal from '@/components/garage/ScooterDescriptionModal';
import OrderHistorySection from '@/components/garage/OrderHistorySection';
import GarageTimeline from '@/components/garage/GarageTimeline';
import QuickAddModificationDialog from '@/components/garage/QuickAddModificationDialog';
import MediaSidebar from '@/components/garage/MediaSidebar';
import { useGarageScooters } from '@/hooks/useGarageScooters';
import GarageMessages from '@/components/garage/GarageMessages';
import { useUpdateNickname, useUpdatePersonalDescription } from '@/hooks/useGarage';
import { useOrderConversations } from '@/hooks/useOrderMessages';
import { useCompatibleParts } from '@/hooks/useCompatibleParts';
import GarageBackground from '@/components/garage/GarageBackground';
import ThemePickerSheet from '@/components/garage/ThemePickerSheet';
import RiderProfileEditDialog from '@/components/garage/RiderProfileEditDialog';
import RiderProfileCard from '@/components/garage/RiderProfileCard';
import WallpaperFAB from '@/components/garage/WallpaperFAB';
import GarageHeaderBar from '@/components/garage/GarageHeaderBar';
import CenteredScooterStage from '@/components/garage/CenteredScooterStage';
import StatTrioCard from '@/components/garage/StatTrioCard';
import FloatingDescriptionPill from '@/components/garage/FloatingDescriptionPill';
import CompatiblePartsRail from '@/components/garage/CompatiblePartsRail';
import PersonalDescription from '@/components/garage/PersonalDescription';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const GaragePreview = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const { scooters, loading: scootersLoading, refetch: refetchScooters } = useGarageScooters();
  const [selectedScooter, setSelectedScooter] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'garage' | 'orders' | 'messages'>('garage');
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [descEditOpen, setDescEditOpen] = useState(false);
  const updateNickname = useUpdateNickname();
  const updatePersonalDescription = useUpdatePersonalDescription();

  const { parts, loading: partsLoading } = useCompatibleParts(
    selectedScooter?.scooter_model?.id
  );

  const { data: convs = [] } = useOrderConversations();
  const totalUnread = convs.reduce((s, c) => s + c.unread_count, 0);

  const handleScooterDeleted = () => {
    refetchScooters();
    setSelectedScooter(null);
  };

  const handleNicknameChange = (nickname: string) => {
    if (selectedScooter?.id) {
      updateNickname.mutate({ garageItemId: selectedScooter.id, nickname });
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'messages' || tab === 'orders' || tab === 'garage') {
      setActiveTab(tab as 'garage' | 'orders' | 'messages');
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
  const model = selectedScooter?.scooter_model;

  return (
    <div className="relative h-screen flex flex-col overflow-hidden overflow-x-hidden pb-24 md:pb-0">
      <GarageBackground />
      <SEO noindex title="Mon Garage — Preview" description="Preview du nouveau layout garage." />
      <Header />

      <main className="flex-1 pt-20 lg:pt-24 pb-4 overflow-hidden flex flex-col">
        <div className="px-4 lg:px-6 max-w-[1920px] mx-auto w-full">
          {/* PREVIEW BADGE */}
          <div className="mb-2 flex justify-center">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-500/20 text-amber-200 border border-amber-400/30 px-3 py-1 rounded-full backdrop-blur-md">
              Preview · /garage-preview
            </span>
          </div>
          <GarageHeaderBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            totalUnread={totalUnread}
          />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'garage' ? (
            <motion.div
              key="garage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* ============= DESKTOP : HERO STAGE ============= */}
              <div className="relative flex-1 hidden lg:block overflow-hidden">

                {/* TOP-LEFT : Rider Profile Card */}
                <div className="absolute top-4 left-6 z-30">
                  <RiderProfileCard
                    profile={profile}
                    variant="desktop"
                    onAvatarClick={() => setProfileEditOpen(true)}
                  />
                </div>

                {/* TOP-CENTER : Stat Trio (Volt/Amp/Watt) */}
                {model && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
                    <StatTrioCard
                      voltage={model.voltage}
                      amperage={model.amperage}
                      power={model.power_watts}
                    />
                  </div>
                )}

                {/* TOP-RIGHT : MediaSidebar (compact) */}
                {model && (
                  <div className="absolute top-4 right-6 z-30 w-[300px]">
                    <MediaSidebar
                      scooterModelId={model.id}
                      scooterName={scooterName}
                      userId={user?.id}
                    />
                  </div>
                )}

                {/* CENTER STAGE : Trottinette HERO */}
                <CenteredScooterStage>
                  {scootersLoading ? (
                    <div className="w-full h-[420px] rounded-2xl bg-white/10 animate-pulse" />
                  ) : (
                    <GarageScooterCarousel
                      scooters={scooters || []}
                      onScooterChange={setSelectedScooter}
                      onDelete={handleScooterDeleted}
                      floating
                    />
                  )}
                </CenteredScooterStage>

                {/* BOTTOM-CENTER : Description pill */}
                {selectedScooter && (
                  <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 z-30 w-[520px] max-w-[80%]">
                    <FloatingDescriptionPill
                      description={selectedScooter.personal_description}
                      onClick={() => setDescEditOpen(true)}
                    />
                  </div>
                )}

                {/* BOTTOM RAIL : Compatible parts + History button */}
                {selectedScooter && (
                  <div className="absolute bottom-6 left-6 right-6 z-30 flex items-center gap-3">
                    <button
                      onClick={() => setHistoryOpen(true)}
                      className="shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-full
                                 bg-white/15 backdrop-blur-xl border border-white/25 shadow-xl
                                 text-white text-xs font-semibold uppercase tracking-wider
                                 hover:bg-white/25 transition"
                      title="Historique des modifications"
                    >
                      <History className="w-4 h-4" />
                      <span>Historique</span>
                    </button>
                    <CompatiblePartsRail
                      parts={parts || []}
                      loading={partsLoading}
                      className="flex-1"
                    />
                  </div>
                )}
              </div>

              {/* ============= MOBILE : Stack vertical ============= */}
              <div className="lg:hidden flex flex-col gap-5 px-4 overflow-y-auto pb-32">
                {/* Profile */}
                <RiderProfileCard
                  profile={profile}
                  variant="mobile"
                  onAvatarClick={() => setProfileEditOpen(true)}
                />

                {/* Stat trio */}
                {model && (
                  <div className="flex justify-center overflow-x-auto scrollbar-hide">
                    <StatTrioCard
                      voltage={model.voltage}
                      amperage={model.amperage}
                      power={model.power_watts}
                    />
                  </div>
                )}

                {/* HERO scooter — 80% width, ~55vh */}
                <div className="w-[90%] mx-auto" style={{ minHeight: '55vh' }}>
                  {scootersLoading ? (
                    <div className="w-full h-[55vh] rounded-2xl bg-white/10 animate-pulse" />
                  ) : (
                    <GarageScooterCarousel
                      scooters={scooters || []}
                      onScooterChange={setSelectedScooter}
                      onDelete={handleScooterDeleted}
                      mobileCleanMode
                      floating
                    />
                  )}
                </div>

                {/* Description pill */}
                {selectedScooter && (
                  <div className="flex justify-center">
                    <FloatingDescriptionPill
                      description={selectedScooter.personal_description}
                      onClick={() => setDescEditOpen(true)}
                    />
                  </div>
                )}

                {/* Parts rail + history */}
                {selectedScooter && (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setHistoryOpen(true)}
                      className="self-start flex items-center gap-2 px-3 py-2 rounded-full
                                 bg-white/15 backdrop-blur-xl border border-white/25 shadow-xl
                                 text-white text-xs font-semibold uppercase tracking-wider"
                    >
                      <History className="w-4 h-4" />
                      <span>Historique</span>
                    </button>
                    <CompatiblePartsRail parts={parts || []} loading={partsLoading} />
                  </div>
                )}

                {/* MediaSidebar mobile under */}
                {model && (
                  <MediaSidebar
                    scooterModelId={model.id}
                    scooterName={scooterName}
                    userId={user?.id}
                  />
                )}
              </div>
            </motion.div>
          ) : activeTab === 'orders' ? (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto pb-8 px-4 md:px-6 max-w-[1920px] mx-auto w-full"
            >
              <OrderHistorySection userId={user?.id} />
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto pb-8 px-4 md:px-6 max-w-[1920px] mx-auto w-full"
            >
              <GarageMessages />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Scooter Description Modal */}
      {model && (
        <ScooterDescriptionModal
          isOpen={showDescriptionModal}
          onClose={() => setShowDescriptionModal(false)}
          scooterName={model.name}
          brandName={model.brand}
          description={model.description || ''}
          specs={{
            power_watts: model.power_watts,
            range_km: model.range_km,
            max_speed_kmh: model.max_speed_kmh,
            voltage: model.voltage,
          }}
        />
      )}

      {/* Plus FAB */}
      {activeTab === 'garage' && scooters && scooters.length > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setQuickAddOpen(true)}
          className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14
                   bg-mineral text-white rounded-full shadow-2xl
                   flex items-center justify-center z-40
                   hover:bg-mineral/90 transition-colors"
          title="Ajouter une modification"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      <WallpaperFAB onClick={() => setThemePickerOpen(true)} />

      <QuickAddModificationDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      <RiderProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />
      <ThemePickerSheet open={themePickerOpen} onOpenChange={setThemePickerOpen} />

      {/* History Sheet — Timeline */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Historique des modifications</SheetTitle>
          </SheetHeader>
          {selectedScooter && (
            <div className="mt-4">
              <GarageTimeline garageItemId={selectedScooter.id} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Description Edit Modal */}
      <Dialog open={descEditOpen} onOpenChange={setDescEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Description perso</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GaragePreview;
