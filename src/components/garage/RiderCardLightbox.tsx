import { lazy, Suspense } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogPortal, DialogOverlay, DialogClose } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';

const RiderCard = lazy(() => import('./RiderCard'));

interface RiderCardLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lightbox plein écran pour la Carte Rider v7.
 * La carte est native en 300px : on l'agrandit via transform scale
 * (1.35 mobile / 1.6 desktop) pour rendre le carrousel 34px et les mods
 * parfaitement lisibles et cliquables.
 */
const RiderCardLightbox = ({ open, onOpenChange }: RiderCardLightboxProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/80 backdrop-blur-md" />
        <DialogPrimitive.Content
          aria-label="Ma Carte Collector"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-0 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          {/* Backdrop cliquable — ferme le modal */}
          <DialogClose
            aria-label="Fermer"
            tabIndex={-1}
            className="absolute inset-0 cursor-default outline-none"
          />

          {/* Bouton de fermeture — verre dépoli sombre, zone tactile 44px */}
          <DialogClose
            aria-label="Fermer la carte"
            className="absolute top-4 right-4 z-20 flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-xl transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="size-5" />
          </DialogClose>

          {/* Wrapper de scale — pointer-events uniquement sur la carte */}
          <div className="pointer-events-none relative z-10 flex max-h-full items-center justify-center">
            <div className="pointer-events-auto origin-center scale-[1.35] md:scale-[1.6]">
              <Suspense
                fallback={
                  <div className="h-[460px] w-[300px] animate-pulse rounded-2xl bg-white/10" />
                }
              >
                {open && <RiderCard mode="owner" />}
              </Suspense>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default RiderCardLightbox;
