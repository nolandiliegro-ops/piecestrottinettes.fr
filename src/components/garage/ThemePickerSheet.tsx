import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useActiveTheme, useAvailableThemes } from '@/hooks/useActiveTheme';
import { Check, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const ThemePickerSheet = ({ open, onOpenChange }: Props) => {
  const { data: themes, isLoading } = useAvailableThemes();
  const { theme: activeTheme, setTheme } = useActiveTheme();

  const handlePick = (t: { key: string; unlocked: boolean; unlock_type: string; required_xp: number }) => {
    if (!t.unlocked) {
      if (t.unlock_type === 'xp') toast.info(`Atteins ${t.required_xp} XP pour débloquer ce fond`);
      else toast.info('Fond payant — bientôt disponible');
      return;
    }
    setTheme.mutate(t.key, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-[hsl(0_0%_10%)] border-t border-[hsl(0_0%_18%)] text-[hsl(0_0%_95%)] max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-[hsl(0_0%_95%)]">Choisir un fond</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-6">
            {themes?.map((t) => {
              const isActive = activeTheme?.key === t.key;
              return (
                <button
                  key={t.id}
                  onClick={() => handlePick(t)}
                  className={`group relative aspect-video rounded-xl overflow-hidden border transition-all ${
                    isActive
                      ? 'border-primary ring-2 ring-primary/50'
                      : 'border-[hsl(0_0%_18%)] hover:border-[hsl(0_0%_35%)]'
                  }`}
                >
                  <img
                    src={t.thumbnail_url || t.image_url}
                    alt={t.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
                    <p className="text-xs font-medium text-white truncate">{t.name}</p>
                    {t.unlock_type === 'xp' && (
                      <p className="text-[10px] text-white/70">{t.required_xp} XP</p>
                    )}
                    {t.unlock_type === 'paid' && t.price_eur != null && (
                      <p className="text-[10px] text-white/70">{t.price_eur.toFixed(2)} €</p>
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                  {!t.unlocked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white/80" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ThemePickerSheet;
