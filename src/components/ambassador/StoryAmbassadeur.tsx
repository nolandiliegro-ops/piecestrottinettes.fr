import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
import { Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AmbassadorStory from './AmbassadorStory';

/* Bloc « Ton visuel story » de l'espace ambassadeur (25/10/2026).
   Tant que la proposition n'est pas choisie, le bloc n'apparaît QU'avec ?story=1..5 : sans paramètre, rien ne change en ligne. */

const VARIANTE_DEFAUT = 0; // 0 = bloc masqué tant que Nolan n'a pas choisi

type Props = { photo: string | null; nom: string; code: string; lien: string; themeKey: string | null | undefined };

const StoryAmbassadeur = ({ photo, nom, code, lien, themeKey }: Props) => {
  const [params] = useSearchParams();
  const brut = Number(params.get('story') ?? VARIANTE_DEFAUT);
  const variante = brut >= 1 && brut <= 5 ? brut : 0;
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const { data: wallpaper } = useQuery({
    queryKey: ['story-wallpaper', themeKey ?? null],
    enabled: variante === 3,
    queryFn: async () => {
      const q = supabase.from('garage_themes').select('image_url').eq('is_active', true);
      const { data } = themeKey
        ? await q.eq('key', themeKey).maybeSingle()
        : await q.order('display_order', { ascending: true }).limit(1).maybeSingle();
      return (data?.image_url as string | undefined) ?? null;
    },
  });

  if (!variante || !code) return null;

  const partager = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      // Cadre 360 px → 1080 × 1920 (format story TikTok / Insta).
      const dataUrl = await toPng(ref.current, { pixelRatio: 3, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `story-${code.toLowerCase()}.png`, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: `Le code ${code}` });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = file.name;
        a.click();
        toast.success('Visuel enregistré en image');
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') toast.error("Impossible de créer l'image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white shadow-md p-5 space-y-4">
      <h2 className="text-lg font-black uppercase tracking-tight text-carbon">Ton visuel story</h2>
      <p className="text-base text-gray-600">Ton badge, ton code et ton lien en QR, prêts à poster en story.</p>
      <div className="flex justify-center">
        {/* Aperçu à 75 % ; l'image exportée est rendue à partir du cadre réel (360 × 640). */}
        <div style={{ width: 270, height: 480, overflow: 'hidden', borderRadius: 16 }}>
          <div style={{ transform: 'scale(0.75)', transformOrigin: 'top left' }}>
            <AmbassadorStory ref={ref} variante={variante} photo={photo} nom={nom} code={code} lien={lien} wallpaper={wallpaper} />
          </div>
        </div>
      </div>
      <button type="button" onClick={partager} disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-lg font-semibold text-base bg-green-700 hover:bg-green-800 text-white disabled:opacity-60">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}Partager ou enregistrer
      </button>
    </section>
  );
};

export default StoryAmbassadeur;
