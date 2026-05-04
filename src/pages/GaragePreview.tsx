import SEO from "@/components/SEO";
import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Loader2, Plus, Bike, Wallpaper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGarageScooters } from '@/hooks/useGarageScooters';
import { useOrderConversations } from '@/hooks/useOrderMessages';

import OrderHistorySection from '@/components/garage/OrderHistorySection';
import GarageMessages from '@/components/garage/GarageMessages';
import GarageHeaderBar from '@/components/garage/GarageHeaderBar';
import GarageTimeline from '@/components/garage/GarageTimeline';
import { useCompatibleParts } from '@/hooks/useCompatibleParts';
import QuickAddModificationDialog from '@/components/garage/QuickAddModificationDialog';
import RiderProfileEditDialog from '@/components/garage/RiderProfileEditDialog';
import ModificationsPreviewCard from '@/components/garage/ModificationsPreviewCard';
import GarageBackground from '@/components/garage/GarageBackground';
import ThemePickerSheet from '@/components/garage/ThemePickerSheet';
import PartCard from '@/components/parts/PartCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Phase A — Rooftop components (étapes 1-7)
import RiderProfileCard from '@/components/garage/RiderProfileCard';
import ScooterPhotoCard from '@/components/garage/ScooterPhotoCard';
import StatsRow from '@/components/garage/StatsRow';
import ScooterIdPill from '@/components/garage/ScooterIdPill';
import HeroScooter from '@/components/garage/HeroScooter';
import SuiviExpertCard from '@/components/garage/SuiviExpertCard';
import ShareBuildCard from '@/components/garage/ShareBuildCard';
import DescriptionCard from '@/components/garage/DescriptionCard';

// Lazy mount — perf mobile (sous le fold)
const TutosCard = lazy(() => import('@/components/garage/TutosCard'));

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// build trigger 2026-05-04T17:00 force redeploy
const GaragePreview = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const { scooters, loading: scootersLoading } = useGarageScooters();
  const [selectedScooterId, setSelectedScooterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'garage' | 'orders' | 'messages'>('garage');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const { data: convs = [] } = useOrderConversations();
  const totalUnread = convs.reduce((s, c) => s + c.unread_count, 0);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'messages' || tab === 'orders' || tab === 'garage') {
      setActiveTab(tab as 'garage' | 'orders' | 'messages');
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!scooters?.length) {
      if (selectedScooterId !== null) {
        setSelectedScooterId(null);
      }
      return;
    }

    const hasValidSelectedScooter = selectedScooterId
      ? scooters.some((scooter) => scooter?.id === selectedScooterId)
      : false;

    if (!hasValidSelectedScooter) {
      setSelectedScooterId(scooters[0]?.id ?? null);
    }
  }, [scooters, selectedScooterId]);

  const selectedScooter = useMemo(() => {
    if (!scooters?.length || !selectedScooterId) return null;

    return scooters.find((scooter) => scooter?.id === selectedScooterId) ?? null;
  }, [scooters, selectedScooterId]);

  // Multi-scooter navigation — index dérivé
  const currentIndex = useMemo(() => {
    if (!scooters?.length || !selectedScooterId) return 0;

    const idx = scooters.findIndex((scooter) => scooter?.id === selectedScooterId);
    return idx >= 0 ? idx : 0;
  }, [scooters, selectedScooterId]);

  const scooterCount = scooters?.length ?? 0;
  const selectedGarageId = selectedScooter?.id ?? null;
  const { parts: compatibleParts, loading: compatiblePartsLoading } = useCompatibleParts(
    selectedScooter?.scooter_model?.id
  );

  const handlePrev = () => {
    if (!scooters || currentIndex <= 0) return;
    setSelectedScooterId(scooters[currentIndex - 1]?.id ?? null);
  };

  const handleNext = () => {
    if (!scooters || currentIndex >= scooterCount - 1) return;
    setSelectedScooterId(scooters[currentIndex + 1]?.id ?? null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-300">
        <Loader2 className="w-8 h-8 animate-spin text-gray-700" />
      </div>
    );
  }

  const model = selectedScooter?.scooter_model;

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden pb-24 md:pb-0">
      <GarageBackground />
      <SEO noindex title="Mon Garage — Preview" description="Preview du nouveau layout garage Rooftop." />
      <Header />

      <main className="relative z-10 flex-1 pt-20 lg:pt-24 pb-4 flex flex-col">
        <div className="px-4 lg:px-6 max-w-[1600px] mx-auto w-full">
          {/* PREVIEW BADGE */}
          <div className="mb-2 flex justify-center">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-500/20 text-amber-100 border border-amber-400/40 px-3 py-1 rounded-full backdrop-blur-md">
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
              className="flex-1 px-4 lg:px-6 max-w-[1600px] mx-auto w-full mt-4"
            >
              {/* === EMPTY / NOT AUTH STATES === */}
              {!user ? (
                <div className="flex flex-col items-center justify-center text-center py-20 max-w-md mx-auto">
                  <div
                    className="rounded-3xl p-8 bg-white/[0.42] backdrop-blur-2xl backdrop-saturate-150 border border-white/35"
                    style={{
                      boxShadow:
                        '0 20px 50px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
                    }}
                  >
                    <Bike className="w-16 h-16 text-gray-700 mx-auto mb-4" strokeWidth={1.5} />
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-2">
                      Connecte-toi
                    </h2>
                    <p className="text-sm text-gray-700 mb-5">
                      Accède à ton garage personnalisé.
                    </p>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl py-3 font-bold text-sm"
                    >
                      Se connecter
                    </button>
                  </div>
                </div>
              ) : scootersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-700" />
                </div>
              ) : scooterCount === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 max-w-md mx-auto">
                  <div
                    className="w-full rounded-3xl p-8 bg-white/[0.42] backdrop-blur-2xl backdrop-saturate-150 border border-white/35"
                    style={{
                      boxShadow:
                        '0 20px 50px -10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.6)',
                    }}
                  >
                    <Bike className="w-16 h-16 text-gray-700 mx-auto mb-4" strokeWidth={1.5} />
                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-2">
                      Ton garage est vide
                    </h2>
                    <p className="text-sm text-gray-700 mb-5">
                      Ajoute ta première trottinette pour débloquer ton cockpit personnalisé.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 mb-6 text-left inline-block">
                      <li>✓ Suivi de maintenance personnalisé</li>
                      <li>✓ Pièces compatibles avec ton modèle</li>
                      <li>✓ Tutos vidéo sur mesure</li>
                      <li>✓ +50 XP à l'ajout de ta première photo</li>
                    </ul>
                    <button
                      onClick={() => navigate('/trottinettes')}
                      className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl py-3 font-bold text-sm"
                    >
                      Ajoute ta première trottinette
                    </button>
                  </div>
                </div>
              ) : !selectedGarageId || !selectedScooter || !selectedScooter.scooter_model ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <Loader2 className="w-8 h-8 animate-spin text-green-700" />
                </div>
              ) : (
                /* === ROOFTOP LAYOUT === */
                <>
                <div
                  className="
                    flex flex-col gap-4
                    md:max-w-2xl md:mx-auto
                    lg:max-w-none lg:mx-0 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:gap-6
                    xl:gap-8
                  "
                >
                  {/* COLONNE GAUCHE — desktop col 1 / mobile order 5-6 */}
                  <aside className="order-5 lg:order-1 flex flex-col gap-4">
                    <ScooterPhotoCard garageItem={selectedScooter} />
                    <DescriptionCard
                      garageId={selectedGarageId}
                      initialDescription={selectedScooter.personal_description}
                    />
                  </aside>

                  {/* COLONNE CENTRE — desktop col 2 */}
                  {/* Mobile : order 2 (Hero), 3 (Stats), 4 (Suivi). Desktop : flow naturel Stats → Hero → Suivi */}
                  <section className="contents lg:flex lg:flex-col lg:gap-6 lg:order-2 min-w-0">
                    {/* StatsRow — desktop : top de la colonne centre. Mobile : order 3 (après Hero) */}
                    <div className="order-3 lg:order-none">
                      <StatsRow
                        voltage={model?.voltage}
                        amperage={model?.amperage}
                        powerWatts={model?.power_watts}
                      />
                    </div>

                    {/* HeroScooter + ScooterIdPill flottante (wrapper relative isolé) */}
                    <div className="relative order-2 lg:order-none">
                      <HeroScooter
                        imageUrl={model?.image_url}
                        modelName={model?.name}
                        scooterCount={scooterCount}
                        currentIndex={currentIndex}
                        onPrev={handlePrev}
                        onNext={handleNext}
                      />
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 max-w-[90%] pointer-events-none">
                        <ScooterIdPill
                          brand={model?.brand}
                          modelName={model?.name}
                          year={null}
                          nickname={selectedScooter.nickname}
                        />
                      </div>
                    </div>

                    {/* Suivi expert */}
                    <div className="order-4 lg:order-none flex flex-col gap-3">
                      <SuiviExpertCard
                        garageId={selectedGarageId}
                        performancePoints={profile?.performance_points}
                        voltage={model?.voltage}
                        amperage={model?.amperage}
                        powerWatts={model?.power_watts}
                      />
                      <ModificationsPreviewCard
                        garageItemId={selectedGarageId}
                        onOpenFullHistory={() => setHistoryOpen(true)}
                        onAddModification={() => setQuickAddOpen(true)}
                      />
                    </div>
                  </section>

                  {/* COLONNE DROITE — desktop col 3 / mobile order 1, 7, 8 */}
                  {/* RiderProfileCard mobile : order 1 */}
                  <div className="order-1 lg:hidden relative">
                    <RiderProfileCard
                      profile={profile}
                      variant="rooftop"
                      showXPBar
                      onAvatarClick={() => setProfileEditOpen(true)}
                    />
                    <button
                      onClick={() => setThemePickerOpen(true)}
                      className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-white/60 backdrop-blur-xl border border-white/50 shadow-md shadow-black/10 flex items-center justify-center hover:bg-white/80 hover:shadow-lg transition-all duration-200"
                      aria-label="Changer le wallpaper du garage"
                      title="Changer le wallpaper"
                    >
                      <Wallpaper className="size-4 text-gray-700" />
                    </button>
                  </div>

                  <aside className="order-7 lg:order-3 flex flex-col gap-4">
                    {/* RiderProfileCard desktop uniquement (mobile rendu en order-1 ci-dessus) */}
                    <div className="hidden lg:block relative">
                      <RiderProfileCard
                        profile={profile}
                        variant="rooftop"
                        showXPBar
                        onAvatarClick={() => setProfileEditOpen(true)}
                      />
                      <button
                        onClick={() => setThemePickerOpen(true)}
                        className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-white/60 backdrop-blur-xl border border-white/50 shadow-md shadow-black/10 flex items-center justify-center hover:bg-white/80 hover:shadow-lg transition-all duration-200"
                        aria-label="Changer le wallpaper du garage"
                        title="Changer le wallpaper"
                      >
                        <Wallpaper className="size-4 text-gray-700" />
                      </button>
                    </div>
                    <Suspense
                      fallback={
                        <div
                          className="rounded-3xl p-5 bg-white/[0.42] backdrop-blur-2xl border border-white/35 h-[260px] animate-pulse"
                        />
                      }
                    >
                      <TutosCard scooterModelId={model?.id} />
                    </Suspense>
                    <ShareBuildCard />
                  </aside>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'orders' ? (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto pb-8 px-4 md:px-6 max-w-[1600px] mx-auto w-full"
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
              className="flex-1 overflow-y-auto pb-8 px-4 md:px-6 max-w-[1600px] mx-auto w-full"
            >
              <GarageMessages />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Plus FAB */}
      {activeTab === 'garage' && scooterCount > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setQuickAddOpen(true)}
          className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14
                   bg-green-700 text-white rounded-full shadow-2xl
                   flex items-center justify-center z-40
                   hover:bg-green-800 transition-colors"
          title="Ajouter une modification"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      <QuickAddModificationDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      <RiderProfileEditDialog open={profileEditOpen} onOpenChange={setProfileEditOpen} />

      {/* History Sheet — Timeline */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Historique des modifications</SheetTitle>
          </SheetHeader>
          {selectedGarageId && (
            <div className="mt-4">
              <GarageTimeline garageItemId={selectedGarageId} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Compatible Parts Sheet */}
      <Sheet open={partsOpen} onOpenChange={setPartsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Pièces compatibles</SheetTitle>
          </SheetHeader>
          {selectedScooter?.scooter_model?.id && (
            <div className="mt-4">
              <CompatiblePartsRail
                parts={compatibleParts ?? []}
                loading={compatiblePartsLoading}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default GaragePreview;
