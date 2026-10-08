import { useQuery } from '@tanstack/react-query';
import { Copy, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RIDER_LAUNCH_OFFER, SHOP_OPEN } from '@/config/launch';

/** Code -20 % personnel du Rider, affiché dans son garage. */
const RiderLaunchCode = () => {
  const { user } = useAuth();

  const { data: code } = useQuery({
    queryKey: ['rider-launch-code', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // La règle d'accès ne renvoie que le code du Rider connecté
      const { data, error } = await (supabase.from('promo_codes') as any)
        .select('code, current_uses, max_uses')
        .eq('campaign', 'rider_launch')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as { code: string; current_uses: number | null; max_uses: number | null } | null;
    },
  });

  if (!code) return null;
  const used = (code.current_uses ?? 0) >= (code.max_uses ?? 1);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.code);
      toast.success('Code copié');
    } catch {
      toast.error('Copie impossible — note le code à la main');
    }
  };

  return (
    <div className="rounded-2xl bg-[#1A1A1A] text-white p-4 shadow-md">
      <div className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-wide text-[#9fd3ad]">
        <Gift className="size-4" />
        Ton offre de lancement
      </div>
      <p className="mt-1 text-[15px] text-white/80">
        -{RIDER_LAUNCH_OFFER.percent}&nbsp;% sur ta première commande
        {SHOP_OPEN ? '' : ' dès l\'ouverture du shop'}.
      </p>
      <button
        type="button"
        onClick={copy}
        disabled={used}
        className="mt-3 w-full min-h-[48px] flex items-center justify-between rounded-lg border border-dashed border-white/40 bg-white/5 px-4 font-display text-2xl tracking-widest disabled:opacity-50"
        aria-label={`Copier le code ${code.code}`}
      >
        <span>{code.code}</span>
        {used ? <span className="text-[14px] font-sans tracking-normal">Utilisé</span> : <Copy className="size-5" />}
      </button>
      <p className="mt-2 text-[14px] text-white/60">
        Plafonné à {RIDER_LAUNCH_OFFER.maxEuros}&nbsp;€, une commande, valable {RIDER_LAUNCH_OFFER.validityDays}&nbsp;jours après
        l'ouverture. Hors trottinettes complètes et batteries.
      </p>
    </div>
  );
};

export default RiderLaunchCode;
