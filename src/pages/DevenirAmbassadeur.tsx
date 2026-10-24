import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Percent, Wallet, BarChart3, CheckCircle2 } from 'lucide-react';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { RESEAUX_AMB } from '@/lib/ambassadorKit';

/* Programme ambassadeurs (24/10/2026) — candidature publique : la fiche arrive dans la colonne « À contacter »
   de l'admin (fonction apply_ambassador : contrôles, anti-doublon par email, plafond de candidatures par heure). */

const AVANTAGES = [
  { i: Percent, t: '10 % pour ta communauté', d: 'Ton code perso donne 10 % de remise sur les pièces (jusqu\'à 30 € par commande).' },
  { i: Wallet, t: '10 % pour toi', d: 'Commission sur chaque commande passée avec ton code ou ton lien, versée chaque mois par PayPal.' },
  { i: BarChart3, t: 'Tout en direct', d: 'Clics, ventes, gains et versements dans ton espace ambassadeur, mis à jour en continu.' },
];

const input = 'w-full min-h-[44px] border border-gray-300 focus:ring-2 focus:ring-green-600 rounded-lg px-3 text-base bg-white';

const DevenirAmbassadeur = () => {
  const [f, setF] = useState({ nom: '', handle: '', reseau: 'tiktok', abonnes: '', email: '', telephone: '', message: '', site: '' });
  const [accord, setAccord] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState('');

  const candidater = useMutation({
    mutationFn: async () => {
      if (f.site) return; // champ piège invisible : un robot l'a rempli, on fait semblant d'accepter
      const n = parseInt(f.abonnes.replace(/\D/g, ''), 10);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc('apply_ambassador', {
        p_nom: f.nom, p_handle: f.handle, p_reseau: f.reseau, p_abonnes: Number.isFinite(n) ? n : null,
        p_email: f.email, p_telephone: f.telephone, p_message: f.message,
      });
      if (error) throw error;
    },
    onSuccess: () => { setEnvoye(true); setErreur(''); },
    onError: (e: Error) => setErreur(e.message),
  });

  const champ = (k: keyof typeof f, label: string, props: Record<string, unknown> = {}) => (
    <div className="space-y-1">
      <label htmlFor={`cand-${k}`} className="block text-sm font-semibold text-carbon">{label}</label>
      <input id={`cand-${k}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={input} {...props} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Devenir ambassadeur | Pièces Trottinettes" description="Créateur trottinette ? Deviens ambassadeur piecestrottinettes.fr : 10 % pour ta communauté, 10 % de commission pour toi, suivi en direct." canonical="https://piecestrottinettes.fr/devenir-ambassadeur" />
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-carbon">Deviens ambassadeur</h1>
            <p className="text-lg text-gray-600">Tu parles trottinette sur TikTok, Instagram ou YouTube ? Fais gagner ta communauté et gagne sur chaque commande.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {AVANTAGES.map((a) => (
              <div key={a.t} className="rounded-2xl bg-white shadow-md p-4 space-y-2">
                <a.i className="w-6 h-6 text-green-700" />
                <p className="text-base font-black uppercase tracking-tight text-carbon">{a.t}</p>
                <p className="text-sm text-gray-600">{a.d}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl bg-white shadow-md p-5">
            {envoye ? (
              <div className="space-y-3">
                <p className="flex gap-2 text-lg font-black uppercase tracking-tight text-carbon"><CheckCircle2 className="w-6 h-6 text-green-700" />Candidature reçue</p>
                <p className="text-base text-gray-600">Nolan te répond par mail sous quelques jours. Dès que c'est validé, tu reçois ton code et l'accès à ton <Link to="/ambassadeur" className="text-green-700 underline">espace ambassadeur</Link>.</p>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (accord) candidater.mutate(); }}>
                <h2 className="text-lg font-black uppercase tracking-tight text-carbon">Ta candidature</h2>
                {champ('nom', 'Prénom ou pseudo *', { required: true, autoComplete: 'given-name' })}
                <div className="grid gap-3 sm:grid-cols-2">
                  {champ('handle', 'Ton compte *', { required: true, placeholder: '@toi.ride' })}
                  <div className="space-y-1">
                    <label htmlFor="cand-reseau" className="block text-sm font-semibold text-carbon">Réseau principal</label>
                    <select id="cand-reseau" value={f.reseau} onChange={(e) => setF({ ...f, reseau: e.target.value })} className={input}>
                      {RESEAUX_AMB.map((r) => <option key={r.k} value={r.k}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {champ('abonnes', 'Abonnés (environ)', { inputMode: 'numeric', placeholder: '5000' })}
                  {champ('email', 'Email *', { type: 'email', required: true, autoComplete: 'email' })}
                </div>
                {champ('telephone', 'Téléphone (facultatif, pour WhatsApp)', { type: 'tel', autoComplete: 'tel' })}
                <div className="space-y-1">
                  <label htmlFor="cand-message" className="block text-sm font-semibold text-carbon">Ta trottinette, ton contenu (facultatif)</label>
                  <textarea id="cand-message" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={3}
                    className="w-full border border-gray-300 focus:ring-2 focus:ring-green-600 rounded-lg px-3 py-2 text-base" />
                </div>
                <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })}
                  className="absolute -left-[9999px] w-px h-px opacity-0" />
                <label className="flex items-start gap-3 text-sm text-carbon min-h-[44px]">
                  <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} className="mt-0.5 w-5 h-5 accent-green-700" />
                  J'accepte d'être recontacté par piecestrottinettes.fr au sujet du programme ambassadeur. Mes informations servent uniquement à ma candidature.
                </label>
                {erreur && <p className="text-sm text-red-700">{erreur}</p>}
                <button type="submit" disabled={!accord || candidater.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-lg bg-green-700 hover:bg-green-800 text-white font-semibold text-base disabled:opacity-50">
                  {candidater.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Envoyer ma candidature
                </button>
                <p className="text-sm text-gray-500">Déjà ambassadeur ? <Link to="/ambassadeur" className="text-green-700 underline">Ouvre ton espace</Link>.</p>
              </form>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DevenirAmbassadeur;
