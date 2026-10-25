import SEO from "@/components/SEO";
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader2 } from 'lucide-react';
import { useGarageScooters } from '@/hooks/useGarageScooters';
import { useOrderConversations } from '@/hooks/useOrderMessages';

import GarageTimeline from '@/components/garage/GarageTimeline';
import QuickAddModificationDialog from '@/components/garage/QuickAddModificationDialog';
import RiderProfileEditDialog from '@/components/garage/RiderProfileEditDialog';
import GarageBackground from '@/components/garage/GarageBackground';
import ThemePickerSheet from '@/components/garage/ThemePickerSheet';
import GarageAtelierView from '@/components/garage/atelier/GarageAtelierView';
import GarageV3, { readGarageSection } from '@/components/garage/v3/GarageV3';
import { ScreenTitle, Box, BoxTitle } from '@/components/garage/v3/ui';
import StandTrott from '@/components/garage/v3/StandTrott';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

/**
 * Garage v3 seul depuis le 25/10/2026 (recette validée) : l'ancien garage (?g=0),
 * l'ancienne carte en fenêtre (?carte=0) et les propositions ?vue=… sont retirés.
 */
const Garage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { section: sectionParam } = useParams<{ section?: string }>();
  const section = readGarageSection(sectionParam);
  const { user, profile, loading: authLoading } = useAuth();
  const { scooters, loading: scootersLoading } = useGarageScooters();
  const [selectedScooterId, setSelectedScooterId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddFor, setQuickAddFor] = useState<string | undefined>(undefined);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  const { data: convs = [] } = useOrderConversations();
  const totalUnread = convs.reduce((s, c) => s + c.unread_count, 0);

  useEffect(() => {
    const raw = searchParams.get('tab');
    // Les anciens liens ?tab=commandes|orders|messages (mails, notifications) ouvrent l'écran Commandes.
    if (raw === 'commandes' || raw === 'orders' || raw === 'messages') {
      navigate('/garage/commandes', { replace: true });
    }
  }, [searchParams, navigate]);

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

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden pb-24 md:pb-0">
      <GarageBackground />
      <SEO
        noindex
        title="Mon Garage"
        description="Ton cockpit personnel : suivi de maintenance, pièces compatibles, tutos et historique de modifications pour ta trottinette électrique."
      />
      <Header />

      <main className="relative z-10 flex-1 pt-20 lg:pt-24 pb-4 flex flex-col">
        {user ? (
          <GarageV3
            section={section}
            unread={totalUnread}
            onEditProfile={() => setProfileEditOpen(true)}
            onTheme={() => setThemePickerOpen(true)}
            trotts={
              <div>
                <ScreenTitle kicker="Mon garage" title="Mes trotts">
                  {scooterCount > 1 ? `${scooterCount} trotts dans ton garage : passe de l'une à l'autre avec les flèches.` : 'Ta machine, son entretien et les pièces qui vont dessus.'}
                </ScreenTitle>
                {scootersLoading ? (
                  <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>
                ) : scooterCount === 0 ? (
                  <Box>
                    <BoxTitle>Ton garage est vide</BoxTitle>
                    <p className="mt-2 text-[15px] text-gray-700">Ajoute ta trottinette : tu verras les pièces qui vont dessus et elle apparaîtra sur ta carte.</p>
                    <button type="button" onClick={() => navigate('/trottinettes')} className="mt-3 min-h-[48px] px-4 text-[15px] font-extrabold text-white bg-[#1A1A1A]">Ajouter ma trottinette</button>
                  </Box>
                ) : selectedScooter && selectedScooter.scooter_model ? (
                  <>
                  <StandTrott src={selectedScooter.scooter_model.image_url || selectedScooter.custom_photo_url} alt={selectedScooter.scooter_model.name} />
                  <GarageAtelierView
                    profile={profile}
                    scooter={selectedScooter as any}
                    scooterCount={scooterCount}
                    currentIndex={currentIndex}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onEditProfile={() => setProfileEditOpen(true)}
                    onTheme={() => setThemePickerOpen(true)}
                    onAddModification={(id?: string) => { setQuickAddFor(id); setQuickAddOpen(true); }}
                    onOpenHistory={() => setHistoryOpen(true)}
                    onOpenRiderCard={() => navigate('/garage')}
                    hideRider
                    hideLaunch
                    standOnDesktop
                  />
                  </>
                ) : (
                  <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>
                )}
              </div>
            }
          />
        ) : (
          // La route est protégée (ProtectedRoute) : ce cas ne dure que le temps de la redirection.
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}
      </main>

      <QuickAddModificationDialog open={quickAddOpen} onOpenChange={(o) => { setQuickAddOpen(o); if (!o) setQuickAddFor(undefined); }} defaultScooterId={quickAddFor} />
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

      <ThemePickerSheet open={themePickerOpen} onOpenChange={setThemePickerOpen} />

      {/* z-10 : sans lui, le fond fixe du garage recouvrait le pied de page (≈ 900 px de « papier peint vide », 18/10) */}
      <div className="relative z-10"><Footer /></div>
    </div>
  );
};

export default Garage;
