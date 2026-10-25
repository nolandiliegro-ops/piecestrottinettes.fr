/* Connexion / inscription aux couleurs du site (26/10/2026, Nolan : « la page de connexion à Google et au garage ne respecte
   pas la DA… les anciens boutons… il faut vraiment faire quelque chose de top, de joli, d'original »).
   Même logique que les pages d'avant (Login.tsx / Register.tsx passent leurs états et leurs fonctions) ; seule la mise en page
   change. 5 compositions derrière `?auth=1..5` (gardé pour l'onglet) ; 0 = l'ancienne page. La n°1 est la lecture littérale.
   Faits affichés, tous vérifiés : code RIDER −20 % (plafond et conditions de config/launch), 200 points à l'inscription
   (fonction handle_new_user), badge IA : un selfie, 2 propositions, 3 essais. */
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Bike, IdCard, Loader2, MessageCircle, Package } from 'lucide-react';
import { RIDER_LAUNCH_OFFER } from '@/config/launch';
import { skotSaison } from '@/lib/skotSaison';
import BadgeIaTeaser, { EXEMPLE_BADGE_IA } from '@/components/launch/BadgeIaTeaser';

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = '#1A1A1A';
const GREEN = '#4A7C59';
const SOFT = '#8FBF9C';
const PAPER = '#FAFAF8';
const LINE = '#E2DCD0';
const cut = (c: number) => `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, 0 100%)`;
const ch = (c: number) => `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;
export const POINTS_BIENVENUE = 200; // handle_new_user insère 200 (lu en base le 26/10)

export const AUTH_DEFAUT = 3; // choix de Nolan (26/10) : 3 · Carte vivante, inscription ET connexion
export function readAuthLook(): number {
  if (typeof window === 'undefined') return AUTH_DEFAUT;
  try {
    const q = new URLSearchParams(window.location.search).get('auth');
    if (q !== null && /^[0-5]$/.test(q)) { window.sessionStorage.setItem('pt-auth', q); return Number(q); }
    const s = window.sessionStorage.getItem('pt-auth');
    return s && /^[0-5]$/.test(s) ? Number(s) : AUTH_DEFAUT;
  } catch { return AUTH_DEFAUT; }
}

type Champs = {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  displayName?: string; setDisplayName?: (v: string) => void;
  confirmPassword?: string; setConfirmPassword?: (v: string) => void;
  marketingConsent?: boolean; setMarketingConsent?: (v: boolean) => void;
};
export type AuthProps = Champs & {
  mode: 'login' | 'register';
  look: number;
  errors: Partial<Record<'email' | 'password' | 'displayName' | 'confirmPassword', string>>;
  isLoading: boolean; isGoogleLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
  returnTo?: string;
};

/* ── Briques ── */
const Titre = ({ l, vert, c = CARBON, s = 34 }: { l: string[]; vert: number[]; c?: string; s?: number }) => (
  <h1 className="uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', fontSize: s, lineHeight: 0.95, letterSpacing: '-0.03em', color: c }}>
    {l.map((x, i) => <span key={i} className="block" style={{ color: vert.includes(i) ? (c === '#FFFFFF' ? SOFT : GREEN) : c }}>{x}</span>)}
  </h1>
);
const SurTitre = ({ children, c = '#6B7280' }: { children: ReactNode; c?: string }) => (
  <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: c }}>
    <span className="w-[9px] h-[9px] shrink-0" style={{ background: GREEN }} />{children}
  </p>
);

const GoogleIcone = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const Champ = ({ id, label, type = 'text', value, onChange, placeholder, error, disabled, autoComplete }:
  { id: string; label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; disabled?: boolean; autoComplete?: string }) => (
  <div className="grid gap-1.5">
    <label htmlFor={id} className="text-sm font-bold uppercase tracking-[0.08em]" style={{ fontFamily: FONT, color: CARBON }}>{label}</label>
    <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} autoComplete={autoComplete}
      className="h-12 px-3.5 rounded-lg border bg-white text-base outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-60"
      style={{ fontFamily: FONT, color: CARBON, borderColor: error ? '#DC2626' : '#D1D5DB' }} />
    {error && <p className="text-sm font-semibold" style={{ fontFamily: FONT, color: '#DC2626' }}>{error}</p>}
  </div>
);

/** Le formulaire, commun aux 5 compositions : Google d'abord, puis email. */
const Formulaire = (p: AuthProps & { sombre?: boolean }) => {
  const off = p.isLoading || p.isGoogleLoading;
  const reg = p.mode === 'register';
  return (
    <div className="grid gap-4">
      <button type="button" onClick={p.onGoogle} disabled={off}
        className="h-[52px] w-full inline-flex items-center justify-center gap-3 bg-white text-[15px] font-extrabold disabled:opacity-60"
        style={{ fontFamily: FONT, color: CARBON, clipPath: cut(10), boxShadow: `inset 0 0 0 1.5px ${CARBON}` }}>
        {p.isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><GoogleIcone /> Continuer avec Google</>}
      </button>
      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1" style={{ background: LINE }} />
        <span className="text-sm font-bold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: '#6B7280' }}>ou par email</span>
        <span className="h-px flex-1" style={{ background: LINE }} />
      </div>
      <form onSubmit={p.onSubmit} className="grid gap-3.5" noValidate>
        {reg && <Champ id="displayName" label="Ton pseudo de rider" value={p.displayName ?? ''} onChange={(v) => p.setDisplayName?.(v)} placeholder="ex. n0n0.ride" error={p.errors.displayName} disabled={off} autoComplete="nickname" />}
        <Champ id="email" label="Email" type="email" value={p.email} onChange={p.setEmail} placeholder="ton@email.com" error={p.errors.email} disabled={off} autoComplete="email" />
        <Champ id="password" label="Mot de passe" type="password" value={p.password} onChange={p.setPassword} placeholder="6 caractères minimum" error={p.errors.password} disabled={off} autoComplete={reg ? 'new-password' : 'current-password'} />
        {reg && <Champ id="confirmPassword" label="Encore une fois" type="password" value={p.confirmPassword ?? ''} onChange={(v) => p.setConfirmPassword?.(v)} placeholder="le même mot de passe" error={p.errors.confirmPassword} disabled={off} autoComplete="new-password" />}
        {reg && (
          <label className="flex items-start gap-3 p-3 cursor-pointer" style={{ background: '#F3F1EC', clipPath: cut(8) }}>
            <input type="checkbox" checked={!!p.marketingConsent} onChange={(e) => p.setMarketingConsent?.(e.target.checked)} disabled={off}
              className="mt-0.5 w-5 h-5 shrink-0 accent-[#4A7C59]" />
            <span className="text-[14px] leading-snug" style={{ fontFamily: FONT, color: CARBON }}>Je veux l'email d'ouverture du shop avec mon code −{RIDER_LAUNCH_OFFER.percent}&nbsp;% et les bons plans pièces. Désinscription en un clic.</span>
          </label>
        )}
        <button type="submit" disabled={off}
          className="mt-1 h-[56px] w-full inline-flex items-center justify-between px-5 text-[15px] font-extrabold uppercase text-white disabled:opacity-60"
          style={{ fontFamily: FONT, background: CARBON, clipPath: cut(12) }}>
          {p.isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <>{reg ? 'Créer ma carte Rider' : 'Ouvrir mon garage'}<ArrowRight className="w-5 h-5" /></>}
        </button>
      </form>
      <p className="text-center text-[15px]" style={{ fontFamily: FONT, color: '#4B5563' }}>
        {reg ? 'Déjà une carte ? ' : 'Pas encore de carte Rider ? '}
        <Link to={`${reg ? '/login' : '/register'}${p.returnTo && p.returnTo !== '/garage' ? `?returnTo=${encodeURIComponent(p.returnTo)}` : ''}`}
          className="inline-flex min-h-[44px] items-center font-extrabold underline underline-offset-4" style={{ color: GREEN }}>
          {reg ? 'Me connecter' : 'Créer la mienne, gratuit'}
        </Link>
      </p>
    </div>
  );
};

/** Ce que l'inscription donne : trois cases façon Garage. */
const Avantages = ({ sombre = false }: { sombre?: boolean }) => {
  const items = [
    { k: `−${RIDER_LAUNCH_OFFER.percent} %`, d: 'sur ta 1re commande' },
    { k: `${POINTS_BIENVENUE}`, d: 'points offerts' },
  ];
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        {items.map((x) => (
          <div key={x.d} className="px-3 py-2.5" style={{ background: sombre ? 'rgba(250,250,248,0.95)' : '#FFFFFF', clipPath: cut(10), boxShadow: `inset 0 0 0 1px ${LINE}` }}>
            <p className="text-[22px] leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', color: GREEN }}>{x.k}</p>
            <p className="mt-1 text-sm font-semibold" style={{ fontFamily: FONT, color: '#374151' }}>{x.d}</p>
          </div>
        ))}
      </div>
      <BadgeIaTeaser v={1} dark={sombre} />
    </div>
  );
};

const Retour = ({ clair = false }: { clair?: boolean }) => (
  <Link to="/" className="inline-flex items-center gap-2 min-h-[44px] text-[15px] font-bold" style={{ fontFamily: FONT, color: clair ? '#FFFFFF' : '#4B5563' }}>
    <ArrowLeft className="w-4 h-4" /> Accueil
  </Link>
);
const Carte = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`bg-white p-5 sm:p-6 ${className}`} style={{ clipPath: cut(18), boxShadow: '0 1px 0 rgba(0,0,0,0.02)' }}>{children}</div>
);

/** Carte Rider vivante (proposition 3) : le pseudo tapé s'écrit dessus. */
const CarteVivante = ({ pseudo, mode }: { pseudo: string; mode: 'login' | 'register' }) => (
  <div className="relative overflow-hidden p-4" style={{ background: CARBON, clipPath: ch(18) }}>
    <div aria-hidden className="absolute -right-12 -top-12 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(143,191,156,0.35), transparent 70%)' }} />
    <div className="relative flex items-center justify-between">
      <span className="text-sm font-extrabold uppercase tracking-[0.18em]" style={{ fontFamily: FONT, color: SOFT }}>Carte Rider</span>
      <img src="/brand/logo-pt-2026-negatif.svg" alt="" className="h-5 w-auto" />
    </div>
    <div className="relative mt-4 flex items-center gap-3">
      <span className="relative w-[64px] h-[64px] shrink-0 inline-flex items-center justify-center bg-white" style={{ clipPath: ch(9) }}>
        <span className="text-[26px]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', color: GREEN }}>?</span>
      </span>
      <div className="min-w-0">
        {/* Le pseudo n'est jamais mis en majuscules (« n0n0 » devenait « NONO », 25/10). */}
        <p className={`text-[22px] leading-none text-white truncate ${mode === 'register' && pseudo.trim() ? '' : 'uppercase'}`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em' }}>
          {mode === 'register' ? (pseudo.trim() || 'Ton pseudo') : 'Re-bienvenue'}
        </p>
        <p className="mt-1.5 text-sm font-semibold" style={{ fontFamily: FONT, color: 'rgba(255,255,255,0.72)' }}>
          {mode === 'register' ? `Niveau 1 · ${POINTS_BIENVENUE} points offerts` : 'Ton garage t\'attend'}
        </p>
      </div>
    </div>
    <div className="relative mt-4 flex items-center justify-between gap-3 px-3 py-2.5" style={{ background: '#262626', clipPath: cut(8) }}>
      <span className="text-base font-extrabold tracking-[0.16em] text-white" style={{ fontFamily: FONT }}>RIDER-••••••</span>
      <span className="text-sm font-extrabold uppercase" style={{ fontFamily: FONT, color: SOFT }}>−{RIDER_LAUNCH_OFFER.percent} %</span>
    </div>
    {mode === 'register' && (
      <div className="relative mt-3 flex items-center gap-2.5">
        <img src={EXEMPLE_BADGE_IA} alt="" className="w-9 h-9 rounded-full object-cover bg-white" />
        <p className="text-sm font-semibold text-white" style={{ fontFamily: FONT }}>Le « ? », c'est ton badge IA : un selfie, l'IA t'en dessine 2.</p>
      </div>
    )}
  </div>
);

const Portes = () => {
  const items = [
    { i: Bike, t: 'Pièces compatibles' }, { i: Package, t: 'Suivi de commandes' },
    { i: MessageCircle, t: 'SKOT répond' }, { i: IdCard, t: 'Carte Rider' },
  ];
  return (
    <ul className="grid grid-cols-2 gap-1.5">
      {items.map(({ i: I, t }) => (
        <li key={t} className="flex items-center gap-2 min-h-[48px] px-3 text-[14px] font-extrabold" style={{ fontFamily: FONT, background: PAPER, color: CARBON, clipPath: ch(10) }}>
          <I className="w-[18px] h-[18px] shrink-0" style={{ color: GREEN }} />{t}
        </li>
      ))}
    </ul>
  );
};

/* ── Les 5 compositions ── */
const AuthNouvelle = (p: AuthProps) => {
  const reg = p.mode === 'register';
  const [saison] = useState(() => skotSaison());
  const skot = saison ? `/skot/p-${saison}.webp` : '/skot/p-salut.webp';
  const titreL = reg ? ['Crée ta', 'carte Rider.'] : ['Ton garage', 't\'attend.'];
  const page = 'min-h-[100dvh] w-full';
  // 2 · Le garage : le 1er wallpaper du Garage (celui qu'un nouveau rider reçoit).
  const { data: wallpaper } = useQuery({
    queryKey: ['auth-wallpaper'],
    enabled: p.look === 2,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from('garage_themes').select('image_url').eq('is_active', true).order('display_order', { ascending: true }).limit(1).maybeSingle();
      return (data?.image_url as string | undefined) ?? null;
    },
  });

  // 1 · Littéral : la même page, aux couleurs du site.
  if (p.look === 1) return (
    <div className={page} style={{ background: PAPER }}>
      <div className="max-w-md mx-auto px-4 pt-3 pb-16 grid gap-5">
        <div className="flex items-center justify-between"><Retour /><img src="/brand/logo-pt-2026.svg" alt="piecestrottinettes.fr" className="h-8 w-auto" /></div>
        <div className="grid gap-3 pt-2">
          <SurTitre>{reg ? 'Gratuit · 1 minute' : 'Connexion'}</SurTitre>
          <Titre l={titreL} vert={[1]} />
        </div>
        {reg && <Avantages />}
        <Carte><Formulaire {...p} /></Carte>
      </div>
    </div>
  );

  // 2 · Le garage : le wallpaper en grand, le formulaire posé dessus.
  if (p.look === 2) return (
    <div className={`${page} relative`} style={{ background: CARBON }}>
      {wallpaper && <img src={wallpaper} alt="" className="absolute inset-0 w-full h-[62vh] object-cover" />}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[62vh]" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, #1A1A1A 100%)' }} />
      <div className="relative max-w-md mx-auto px-4 pt-3 pb-16 grid gap-5">
        <Retour clair />
        <div className="grid gap-3 pt-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em]" style={{ fontFamily: FONT, color: SOFT }}>{reg ? 'Ton garage · gratuit' : 'Bon retour'}</p>
          <Titre l={titreL} vert={[1]} c="#FFFFFF" s={38} />
        </div>
        {reg && <Avantages sombre />}
        <div className="p-5" style={{ background: PAPER, clipPath: cut(18) }}><Formulaire {...p} /></div>
      </div>
    </div>
  );

  // 3 · Carte Rider vivante : la carte se remplit pendant qu'on tape.
  if (p.look === 3) return (
    <div className={page} style={{ background: '#EFEBE3' }}>
      <div className="max-w-md mx-auto px-4 pt-3 pb-16 grid gap-5">
        <div className="flex items-center justify-between"><Retour /><img src="/brand/logo-pt-2026.svg" alt="piecestrottinettes.fr" className="h-8 w-auto" /></div>
        <Titre l={reg ? ['Ta carte', 'se remplit.'] : ['Ton garage', 't\'attend.']} vert={[1]} s={32} />
        <CarteVivante pseudo={p.displayName ?? ''} mode={p.mode} />
        <Carte><Formulaire {...p} /></Carte>
      </div>
    </div>
  );

  // 4 · SKOT accueille : la mascotte parle, le formulaire suit.
  if (p.look === 4) return (
    <div className={page} style={{ background: PAPER }}>
      <div className="max-w-md mx-auto px-4 pt-3 pb-16 grid gap-4">
        <div className="flex items-center justify-between"><Retour /><img src="/brand/logo-pt-2026.svg" alt="piecestrottinettes.fr" className="h-8 w-auto" /></div>
        <div className="flex items-end gap-1 pt-2">
          <img src={skot} alt="SKOT, la mascotte de l'atelier" className="w-[128px] h-[128px] -ml-2 shrink-0" />
          <div className="flex-1 min-w-0 mb-6 p-[2px]" style={{ background: CARBON, clipPath: cut(10) }}>
            <div className="bg-white px-3.5 py-2.5" style={{ clipPath: cut(9) }}>
              <p className="text-[16px] font-extrabold italic leading-tight" style={{ fontFamily: FONT, color: CARBON }}>{reg ? 'Crée ta carte Rider !' : 'Salut rider !'}</p>
              <p className="mt-0.5 text-[14px] leading-snug" style={{ fontFamily: FONT, color: '#374151' }}>{reg ? 'Et je te dessine ton badge en prime.' : 'Connecte-toi, je garde ton garage au chaud.'}</p>
            </div>
          </div>
        </div>
        {reg && <Avantages />}
        <Carte><Formulaire {...p} /></Carte>
      </div>
    </div>
  );

  // 5 · Les portes du garage : ce qu'il y a derrière, en boutons façon Garage, puis le formulaire.
  return (
    <div className={page} style={{ background: CARBON }}>
      <div className="max-w-md mx-auto px-4 pt-3 pb-16 grid gap-5">
        <Retour clair />
        <div className="grid gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.16em]" style={{ fontFamily: FONT, color: SOFT }}>{reg ? 'Ton garage · gratuit' : 'Connexion'}</p>
          <Titre l={['Ton garage,', 'ton QG.']} vert={[1]} c="#FFFFFF" s={36} />
        </div>
        <Portes />
        {reg && <BadgeIaTeaser v={1} dark />}
        <div className="p-5" style={{ background: PAPER, clipPath: cut(18) }}>
          {reg && <p className="mb-4 text-[15px] font-bold" style={{ fontFamily: FONT, color: CARBON }}>−{RIDER_LAUNCH_OFFER.percent} % sur ta 1re commande · {POINTS_BIENVENUE} points offerts</p>}
          <Formulaire {...p} />
        </div>
      </div>
    </div>
  );
};

export default AuthNouvelle;
