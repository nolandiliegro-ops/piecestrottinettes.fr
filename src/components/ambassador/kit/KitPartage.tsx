import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
import { Check, Copy, Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FORMATS, type KitFormat } from './KitFormats';
import type { KitData } from './kitBase';
import { remplirTexte, TONS } from './kitTextes';

/* « Ton kit de partage » de l'espace ambassadeur (25/10/2026). Choix de Nolan, deux tours de 5 propositions :
   carte 3 Carte Rider · QR 2 Scanne-moi · code 2 Ma trott · sticker 2 Bandeau · post 2 Affiche claire ·
   bannière 2 Badge + ma trott · textes « L'atelier ». Pages de vote : artifacts 2nhpg4K9wJSweLBHNgMAv1 et 4uWyZiG7qak2z18a45rosM. */

const CHOIX: Record<KitFormat['id'], number> = { carte: 3, qr: 2, code: 2, sticker: 2, post: 2, banniere: 2 };
const TON_CHOISI = 2; // « L'atelier »

// Les 3 pièces du post « du moment » : forte marge, celles qui s'usent le plus vite. Libellés courts pour le visuel.
const PIECES: { slug: string; nom: string }[] = [
  { slug: 'chambre-a-air-xiaomi-8-5x2-renforcee', nom: 'Chambre à air renforcée' },
  { slug: 'plaquettes-de-frein-xiaomi-m365', nom: 'Plaquettes de frein' },
  { slug: 'pneu-renforce-xiaomi-m365-50-75-6-1', nom: 'Pneu renforcé' },
];
const TROTT_REPLI = 'mi-3'; // la plus vendue, si le garage est vide

// Aperçu : largeur à l'écran par format (la bannière prend toute la ligne).
const APERCU: Record<KitFormat['id'], number> = { carte: 280, qr: 136, code: 136, sticker: 136, post: 136, banniere: 280 };
// Ordre d'affichage : les deux formats paysage prennent une ligne entière, les quatre autres vont par paires.
const ORDRE: KitFormat['id'][] = ['carte', 'qr', 'sticker', 'code', 'post', 'banniere'];

type Props = { userId: string | undefined; photo: string | null; nom: string; code: string; lien: string; themeKey: string | null | undefined };

const Tuile = ({ f, d, code }: { f: KitFormat; d: KitData; code: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const v = CHOIX[f.id];
  const largeur = APERCU[f.id];
  const echelle = largeur / f.w;
  const C = f.Comp;

  const partager = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      // Safari / iPhone : 1er rendu jeté, html-to-image n'y embarque pas toujours les images au premier passage
      // (même parade que la carte Rider, RiderCardStory). Pas de cacheBust : les images sont déjà chargées dans la page.
      const webkit = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Android/.test(navigator.userAgent));
      if (webkit) await toPng(ref.current, { pixelRatio: f.ratio }).catch(() => null);
      const dataUrl = await toPng(ref.current, { pixelRatio: f.ratio });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${f.id}-${code.toLowerCase()}.png`, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (x: { files: File[] }) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: `Le code ${code}` });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = file.name;
        a.click();
        toast.success('Image enregistrée');
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') toast.error("Impossible de créer l'image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${APERCU[f.id] > 200 ? 'col-span-2' : ''}`}>
      <div className="flex justify-center rounded-xl bg-gray-100 p-2"
        style={f.transparent ? { backgroundImage: 'linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0,8px 8px' } : undefined}>
        <div style={{ width: largeur, height: Math.round(f.h * echelle), overflow: 'hidden', borderRadius: 8 }}>
          {/* L'image exportée part du cadre réel ; seul l'aperçu est réduit. */}
          <div style={{ transform: `scale(${echelle})`, transformOrigin: 'top left', width: f.w }}>
            <C ref={ref} v={v} d={d} />
          </div>
        </div>
      </div>
      <p className="text-sm font-bold uppercase tracking-tight text-carbon">{f.titre}</p>
      <p className="text-sm text-gray-500 leading-snug">{f.usage}</p>
      <button type="button" onClick={partager} disabled={busy}
        className="mt-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg font-semibold text-sm bg-green-700 hover:bg-green-800 text-white disabled:opacity-60">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}Partager
      </button>
    </div>
  );
};

const Texte = ({ titre, texte }: { titre: string; texte: string }) => {
  const [ok, setOk] = useState(false);
  const copier = async () => {
    try { await navigator.clipboard.writeText(texte); setOk(true); toast.success(`${titre} : copié`); window.setTimeout(() => setOk(false), 1800); }
    catch { toast.error('Copie impossible : sélectionne le texte à la main'); }
  };
  return (
    <div className="rounded-xl border border-gray-200 p-3 space-y-2">
      <p className="text-sm font-bold text-green-700">{titre}</p>
      <p className="text-base text-carbon select-all">{texte}</p>
      <button type="button" onClick={copier} className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-carbon">
        {ok ? <Check className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4" />}{ok ? 'Copié' : 'Copier'}
      </button>
    </div>
  );
};

const KitPartage = ({ userId, photo, nom, code, lien, themeKey }: Props) => {
  const { data: wallpaper } = useQuery({
    queryKey: ['kit-wallpaper', themeKey ?? null],
    queryFn: async () => {
      const q = supabase.from('garage_themes').select('image_url').eq('is_active', true);
      const { data } = themeKey
        ? await q.eq('key', themeKey).maybeSingle()
        : await q.order('display_order', { ascending: true }).limit(1).maybeSingle();
      return (data?.image_url as string | undefined) ?? null;
    },
  });

  const { data: trott } = useQuery({
    queryKey: ['kit-trott', userId ?? null],
    queryFn: async () => {
      if (userId) {
        const { data } = await supabase.from('user_garage')
          .select('is_featured, added_at, scooter_model:scooter_models(name, image_url)')
          .eq('user_id', userId)
          .order('is_featured', { ascending: false })
          .order('added_at', { ascending: false })
          .limit(5);
        type Ligne = { scooter_model: { name: string; image_url: string | null } | null };
        const m = ((data ?? []) as unknown as Ligne[]).map((r) => r.scooter_model).find((x) => x?.image_url);
        if (m?.image_url) return { nom: m.name, image: m.image_url };
      }
      const { data: repli } = await supabase.from('scooter_models').select('name, image_url').eq('slug', TROTT_REPLI).maybeSingle();
      return repli?.image_url ? { nom: repli.name as string, image: repli.image_url as string } : null;
    },
  });

  const { data: pieces } = useQuery({
    queryKey: ['kit-pieces'],
    queryFn: async () => {
      const { data } = await supabase.from('parts').select('slug, image_url').in('slug', PIECES.map((p) => p.slug)).eq('published', true);
      return PIECES.map((p) => ({ nom: p.nom, image: (data ?? []).find((r) => r.slug === p.slug)?.image_url as string | undefined }))
        .filter((p): p is { nom: string; image: string } => !!p.image);
    },
  });

  if (!code) return null;
  const d: KitData = { photo, nom, code, lien, wallpaper, trott: trott ?? null, pieces: pieces ?? [] };
  const ton = TONS[TON_CHOISI];

  return (
    <section className="rounded-2xl bg-white shadow-md p-5 space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-black uppercase tracking-tight text-carbon">Ton kit de partage</h2>
        <p className="text-base text-gray-600">Six visuels à ton code, prêts à poster. Chacun porte la mention « Collaboration commerciale » imposée par la loi.</p>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6">
        {ORDRE.map((id) => FORMATS.find((f) => f.id === id)!).map((f) => <Tuile key={f.id} f={f} d={d} code={code} />)}
      </div>
      <div className="space-y-3">
        <h3 className="text-base font-black uppercase tracking-tight text-carbon">Textes prêts à copier</h3>
        <Texte titre="Bio" texte={remplirTexte(ton.bio, code, lien)} />
        <Texte titre="Légende" texte={remplirTexte(ton.legende, code, lien)} />
        <Texte titre="Message privé" texte={remplirTexte(ton.message, code, lien)} />
        <p className="text-sm text-gray-500">Sur TikTok et Instagram, active aussi le bouton « contenu sponsorisé » ou « partenariat rémunéré » de la publication.</p>
      </div>
    </section>
  );
};

export default KitPartage;
