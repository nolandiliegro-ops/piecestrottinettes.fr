import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Copy, Link2, MousePointerClick, Users, ShoppingBag, Wallet, Clock, CheckCircle2, FileText, Mail, Sparkles } from 'lucide-react';
import RiderBadgeIaDialog from '@/components/garage/RiderBadgeIaDialog';
import StoryAmbassadeur from '@/components/ambassador/StoryAmbassadeur';
import KitPartage from '@/components/ambassador/kit/KitPartage';
import { aUnBadgeIa, inviteDejaVue } from '@/components/ambassador/kit/badgeInviteEtat';

const BadgeInviteModal = lazy(() => import('@/components/ambassador/kit/BadgeInviteModal'));
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { lienCreateur, STATUTS_JURIDIQUES, REGLES_CONTENU, HOOKS } from '@/lib/ambassadorKit';

/* Programme ambassadeurs (24/10/2026) — espace du créateur : ses chiffres, ses versements, son kit, son contrat.
   Tout passe par des fonctions de la base qui ne renvoient QUE les données du créateur connecté (jamais de client). */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (f: string, a?: Record<string, unknown>) => (supabase as any).rpc(f, a);

interface Dash {
  id: string; nom: string; handle: string | null; statut: string; taux: number; avatar_url: string | null;
  codes_actifs: string[]; clics_30j: number; clics_total: number; cartes_rider: number; commandes: number;
  commission_acquise: number; commission_en_attente: number; deja_paye: number;
  versements: { periode: string; montant: number; paye_le: string | null }[];
  contrat: { version_actuelle: string; signe_version: string | null; signe_le: string | null };
  profil: { email: string | null; telephone: string | null; adresse: string | null; pays_residence: string | null; statut_juridique: string | null; siret: string | null; email_paypal: string | null; handle: string | null };
}

const eur = (n: number) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`;
const copier = async (t: string, quoi: string) => {
  try { await navigator.clipboard.writeText(t); toast.success(`${quoi} copié`); } catch { toast.error('Copie impossible'); }
};
const btn = 'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-lg font-semibold text-base';
const card = 'rounded-2xl bg-white shadow-md p-5 space-y-4';
const titre = 'text-lg font-black uppercase tracking-tight text-carbon';

/* ── Connexion par lien envoyé par mail ── */
const Connexion = () => {
  const [email, setEmail] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const envoyer = useMutation({
    mutationFn: async () => {
      try { localStorage.setItem('pt-amb-retour', String(Date.now())); } catch { /* ignore */ }
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/ambassadeur`, shouldCreateUser: true },
      });
      if (error) throw error;
    },
    onSuccess: () => setEnvoye(true),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <section className={card}>
      <h2 className={titre}>Connexion à ton espace</h2>
      {envoye ? (
        <p className="text-base text-carbon flex gap-2"><Mail className="w-5 h-5 shrink-0 text-green-700" />
          Lien envoyé à <b>{email}</b>. Ouvre le mail et clique sur le lien depuis ce téléphone ou cet ordinateur.</p>
      ) : (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (email.trim()) envoyer.mutate(); }}>
          <label htmlFor="amb-login-email" className="block text-sm font-semibold text-carbon">L'email que tu as donné à piecestrottinettes.fr</label>
          <input id="amb-login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            className="w-full min-h-[44px] border border-gray-300 focus:ring-2 focus:ring-green-600 rounded-lg px-3 text-base" placeholder="toi@exemple.com" />
          <button type="submit" disabled={envoyer.isPending} className={`${btn} w-full bg-green-700 hover:bg-green-800 text-white disabled:opacity-60`}>
            {envoyer.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Recevoir mon lien de connexion
          </button>
        </form>
      )}
      <p className="text-sm text-gray-500">Pas encore ambassadeur ? <Link to="/devenir-ambassadeur" className="text-green-700 underline">Candidate ici</Link>.</p>
    </section>
  );
};

/* ── Coordonnées + signature du contrat ── */
const Contrat = ({ d }: { d: Dash }) => {
  const qc = useQueryClient();
  const signe = !!d.contrat.signe_le && d.contrat.signe_version === d.contrat.version_actuelle;
  const [f, setF] = useState({
    adresse: d.profil.adresse ?? '', pays_residence: d.profil.pays_residence ?? 'France', statut_juridique: d.profil.statut_juridique ?? '',
    siret: d.profil.siret ?? '', telephone: d.profil.telephone ?? '', email_paypal: d.profil.email_paypal ?? '', handle: d.profil.handle ?? '',
  });
  const [accepte, setAccepte] = useState(false);
  const [signataire, setSignataire] = useState('');
  const profilComplet = !!(d.profil.adresse && d.profil.statut_juridique && d.profil.pays_residence &&
    (d.profil.statut_juridique === 'particulier' || d.profil.siret));

  const { data: texte } = useQuery({
    queryKey: ['amb-contrat-texte', d.id, d.profil],
    queryFn: async () => { const { data, error } = await rpc('ambassador_contract_text', { p_amb: d.id }); if (error) throw error; return data as string; },
  });
  const sauver = useMutation({
    mutationFn: async () => { const { error } = await rpc('update_my_ambassador_profile', { p: f }); if (error) throw error; },
    onSuccess: () => { toast.success('Coordonnées enregistrées'); qc.invalidateQueries({ queryKey: ['amb-dashboard'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const signer = useMutation({
    mutationFn: async () => { const { error } = await rpc('sign_ambassador_contract', { p_signataire: signataire, p_user_agent: navigator.userAgent }); if (error) throw error; },
    onSuccess: () => { toast.success('Contrat signé'); qc.invalidateQueries({ queryKey: ['amb-dashboard'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const champ = (k: keyof typeof f, label: string, props: Record<string, unknown> = {}) => (
    <div className="space-y-1">
      <label htmlFor={`amb-p-${k}`} className="block text-sm font-semibold text-carbon">{label}</label>
      <input id={`amb-p-${k}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}
        className="w-full min-h-[44px] border border-gray-300 focus:ring-2 focus:ring-green-600 rounded-lg px-3 text-base" {...props} />
    </div>
  );

  return (
    <section className={card}>
      <h2 className={titre}>Ton contrat</h2>
      {signe ? (
        <p className="flex gap-2 text-base text-carbon"><CheckCircle2 className="w-5 h-5 shrink-0 text-green-700" />
          Signé le {new Date(d.contrat.signe_le!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} ({d.contrat.signe_version}).</p>
      ) : (
        <p className="text-base text-gray-600">Complète tes coordonnées, lis le contrat, puis signe en ligne. Elles servent au contrat et à tes paiements, rien d'autre.</p>
      )}

      {!signe && (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); sauver.mutate(); }}>
          {champ('adresse', 'Adresse postale', { autoComplete: 'street-address', placeholder: 'N°, rue, code postal, ville' })}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="amb-p-statut" className="block text-sm font-semibold text-carbon">Statut</label>
              <select id="amb-p-statut" value={f.statut_juridique} onChange={(e) => setF({ ...f, statut_juridique: e.target.value })}
                className="w-full min-h-[44px] border border-gray-300 rounded-lg px-3 text-base bg-white">
                <option value="">Choisir…</option>
                {STATUTS_JURIDIQUES.map((s) => <option key={s.k} value={s.k}>{s.label}</option>)}
              </select>
            </div>
            {champ('pays_residence', 'Pays de résidence fiscale')}
          </div>
          {(f.statut_juridique === 'auto_entrepreneur' || f.statut_juridique === 'societe') && champ('siret', 'SIRET', { inputMode: 'numeric' })}
          <div className="grid gap-3 sm:grid-cols-2">
            {champ('telephone', 'Téléphone', { type: 'tel', autoComplete: 'tel' })}
            {champ('email_paypal', 'Email PayPal (tes paiements)', { type: 'email' })}
          </div>
          {champ('handle', 'Ton compte (ex. @toi.ride)')}
          <button type="submit" disabled={sauver.isPending} className={`${btn} bg-white border border-gray-300 text-carbon`}>
            {sauver.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Enregistrer mes coordonnées
          </button>
        </form>
      )}

      <details className="rounded-xl border border-gray-200">
        <summary className="cursor-pointer min-h-[44px] px-4 flex items-center gap-2 font-semibold text-carbon"><FileText className="w-4 h-4" />Lire le contrat</summary>
        <div className="px-4 pb-4 whitespace-pre-wrap text-sm leading-relaxed text-carbon">{texte ?? 'Chargement…'}</div>
      </details>

      {!signe && (
        <div className="space-y-3">
          <label className="flex items-start gap-3 text-base text-carbon min-h-[44px]">
            <input type="checkbox" checked={accepte} onChange={(e) => setAccepte(e.target.checked)} className="mt-1 w-5 h-5 accent-green-700" />
            J'ai lu le contrat et je l'accepte.
          </label>
          <div className="space-y-1">
            <label htmlFor="amb-signataire" className="block text-sm font-semibold text-carbon">Ton nom complet (signature)</label>
            <input id="amb-signataire" value={signataire} onChange={(e) => setSignataire(e.target.value)} autoComplete="name"
              className="w-full min-h-[44px] border border-gray-300 focus:ring-2 focus:ring-green-600 rounded-lg px-3 text-base" />
          </div>
          {!profilComplet && <p className="text-sm text-amber-800">Enregistre d'abord ton adresse, ton statut et ton pays (et ton SIRET si tu es auto-entrepreneur).</p>}
          <button type="button" onClick={() => signer.mutate()} disabled={!accepte || signataire.trim().length < 3 || !profilComplet || signer.isPending}
            className={`${btn} w-full bg-green-700 hover:bg-green-800 text-white disabled:opacity-50`}>
            {signer.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Signer le contrat
          </button>
        </div>
      )}
    </section>
  );
};

/* ── Tableau de bord ── */
const Tableau = ({ d }: { d: Dash }) => {
  const { profile } = useAuth();
  const [badgeOpen, setBadgeOpen] = useState(false);
  const code = d.codes_actifs[0] ?? '';
  const aVerser = Math.max(0, Number(d.commission_acquise) - Number(d.deja_paye));
  const chiffres = [
    { i: MousePointerClick, l: 'Clics (30 jours)', v: d.clics_30j },
    { i: Users, l: 'Cartes Rider', v: d.cartes_rider },
    { i: ShoppingBag, l: 'Commandes', v: d.commandes },
    { i: Clock, l: 'En attente (< 30 j)', v: eur(d.commission_en_attente) },
    { i: Wallet, l: 'À te verser', v: eur(aVerser) },
    { i: CheckCircle2, l: 'Déjà versé', v: eur(d.deja_paye) },
  ];
  const photo = profile?.avatar_url || d.avatar_url;
  // 25/10 : invitation badge IA à l'ouverture de l'espace, une seule fois, si pas encore de badge IA (verrouillée une fois ouverte).
  const [invite, setInvite] = useState<'attente' | 'ouverte' | 'fermee'>('attente');
  const eligibleInvite = !!profile && !aUnBadgeIa(photo) && !inviteDejaVue('ambassadeur');
  useEffect(() => {
    if (invite !== 'attente' || !eligibleInvite) return;
    const t = window.setTimeout(() => setInvite('ouverte'), 800);
    return () => window.clearTimeout(t);
  }, [invite, eligibleInvite]);
  return (
    <div className="space-y-5">
      {invite === 'ouverte' && <Suspense fallback={null}><BadgeInviteModal contexte="ambassadeur" onFin={() => setInvite('fermee')} /></Suspense>}
      <section className={card}>
        <div className="flex items-center gap-4">
          {photo
            ? <img src={photo} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-green-700 ring-offset-2" />
            : <span className="w-20 h-20 rounded-full bg-green-700 text-white text-2xl font-black grid place-items-center">{d.nom.slice(0, 1).toUpperCase()}</span>}
          <div className="min-w-0">
            <h1 className="text-2xl font-black uppercase tracking-tight text-carbon truncate">{d.nom}</h1>
            <p className="text-base text-gray-500">Ambassadeur · {d.taux} % de commission</p>
            <button type="button" onClick={() => setBadgeOpen(true)} className="mt-1 inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-green-700 underline underline-offset-2">
              <Sparkles className="w-4 h-4" />{photo ? 'Refaire ma photo en badge IA' : 'Créer ma photo en badge IA'}
            </button>
          </div>
        </div>
        <RiderBadgeIaDialog open={badgeOpen} onOpenChange={setBadgeOpen} />
        {code ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-carbon">Ton code (10 % pour ta communauté)</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-4 py-2.5 rounded-lg bg-green-700/10 text-green-800 text-xl font-black tracking-wider">{code}</span>
              <button type="button" onClick={() => copier(code, 'Code')} className={`${btn} border border-gray-300 bg-white text-carbon`}><Copy className="w-4 h-4" />Code</button>
              <button type="button" onClick={() => copier(lienCreateur(code), 'Lien')} className={`${btn} border border-gray-300 bg-white text-carbon`}><Link2 className="w-4 h-4" />Lien</button>
            </div>
            <p className="text-sm text-gray-500 break-all">{lienCreateur(code)}</p>
          </div>
        ) : <p className="text-base text-amber-800">Ton code arrive : Nolan le crée dès que ta candidature est validée.</p>}
      </section>

      <StoryAmbassadeur photo={photo} nom={d.nom} code={code} lien={code ? lienCreateur(code) : ''} themeKey={profile?.active_theme_key} />

      <KitPartage userId={profile?.id} photo={photo} nom={d.nom} code={code} lien={code ? lienCreateur(code) : ''} themeKey={profile?.active_theme_key} points={profile?.performance_points} ville={profile?.rider_location} />

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {chiffres.map((c) => (
          <div key={c.l} className="rounded-2xl bg-white shadow-md p-4">
            <p className="flex items-center gap-1.5 text-sm text-gray-500"><c.i className="w-4 h-4" />{c.l}</p>
            <p className="text-xl font-black text-carbon tabular-nums">{c.v}</p>
          </div>
        ))}
      </section>

      <section className={card}>
        <h2 className={titre}>Tes versements</h2>
        <p className="text-sm text-gray-500">Une commission est acquise 30 jours après la commande, puis versée chaque mois par PayPal dès 20 €.</p>
        {d.versements.length === 0
          ? <p className="text-base text-gray-600">Aucun versement pour l'instant.</p>
          : (
            <ul className="divide-y divide-gray-100">
              {d.versements.map((v) => (
                <li key={v.periode} className="flex items-center justify-between min-h-[44px] text-base">
                  <span>{v.periode}</span>
                  <span className="text-gray-500">{v.paye_le ? `payé le ${new Date(v.paye_le).toLocaleDateString('fr-FR')}` : 'à venir'}</span>
                  <span className="font-bold tabular-nums">{eur(v.montant)}</span>
                </li>
              ))}
            </ul>
          )}
      </section>

      <section className={card}>
        <h2 className={titre}>Règles et accroches</h2>
        <ul className="space-y-2 text-base text-carbon list-disc pl-5">{REGLES_CONTENU.map((r) => <li key={r}>{r}</li>)}</ul>
        <p className="text-sm font-semibold text-carbon">Idées d'accroche</p>
        <ul className="space-y-2 text-base text-gray-700">{HOOKS.map((h) => <li key={h}>{h}</li>)}</ul>
        <p className="text-sm text-gray-500">Les pièces qui se vendent le mieux : <Link className="text-green-700 underline" to="/catalogue">chambres à air, pneus, plaquettes, chargeurs</Link>.</p>
      </section>

      <Contrat d={d} />
    </div>
  );
};

const Ambassadeur = () => {
  const { user, loading } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['amb-dashboard', user?.email],
    enabled: !!user,
    queryFn: async (): Promise<Dash | null> => {
      await rpc('claim_my_ambassador');
      const { data, error } = await rpc('my_ambassador_dashboard');
      if (error) throw error;
      return (data ?? null) as Dash | null;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Espace ambassadeur | Pièces Trottinettes" description="Ton espace ambassadeur piecestrottinettes.fr : ton code, tes clics, tes ventes, tes commissions et ton contrat." canonical="https://piecestrottinettes.fr/ambassadeur" />
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto space-y-5">
          {!user && !loading && (
            <>
              <div className="space-y-2">
                <h1 className="text-3xl font-black uppercase tracking-tight text-carbon">Espace ambassadeur</h1>
                <p className="text-base text-gray-600">Ton code, tes clics, tes ventes, tes commissions et ton contrat, au même endroit.</p>
              </div>
              <Connexion />
            </>
          )}
          {(loading || (user && isLoading)) && <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}
          {user && error && <p className="rounded-2xl bg-red-50 text-red-800 p-4 text-base">Lecture impossible : {(error as Error).message}</p>}
          {user && !isLoading && !error && !data && (
            <section className={card}>
              <h1 className={titre}>Aucun espace relié à ce compte</h1>
              <p className="text-base text-gray-600">Tu es connecté avec <b>{user.email}</b>. Ton espace s'ouvre avec l'email donné à piecestrottinettes.fr lors de ton inscription au programme.</p>
              <Link to="/devenir-ambassadeur" className={`${btn} bg-green-700 hover:bg-green-800 text-white`}>Devenir ambassadeur</Link>
            </section>
          )}
          {data && <Tableau d={data} />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Ambassadeur;
