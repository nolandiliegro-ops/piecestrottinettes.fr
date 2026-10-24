import { Link } from 'react-router-dom';
import { Megaphone, ChevronRight } from 'lucide-react';
import { useMyAmbassador, resteAVerser } from '@/hooks/useMyAmbassador';

/* Programme ambassadeurs (25/10/2026) — accès à /ambassadeur depuis le Garage.
   - créateur relié : carte « Espace ambassadeur » (code, clics 30 j, à verser), visible même garage vide ;
   - sinon (variante "invite") : petite carte « Deviens ambassadeur » vers la candidature. */

const eur = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;
const verre = 'group relative flex w-full items-center gap-3 overflow-hidden rounded-3xl border border-white/40 bg-white/[0.42] p-4 text-left backdrop-blur-2xl shadow-lg shadow-black/10 transition-all duration-200 hover:bg-white/60 hover:shadow-xl min-h-[64px]';

export default function AmbassadorGarageCard({ invite = false }: { invite?: boolean }) {
  const { data: amb, isLoading } = useMyAmbassador();
  if (isLoading) return null;

  if (amb) {
    if (invite) return null;
    const code = amb.codes_actifs?.[0];
    return (
      <Link to="/ambassadeur" className={verre} data-testid="garage-ambassadeur">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-white shadow-md shadow-green-900/30 transition-transform duration-200 group-hover:scale-105">
          <Megaphone className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black uppercase tracking-tight text-gray-900">Mon espace ambassadeur</span>
          <span className="block text-sm text-gray-700 truncate">
            {code ? `${code} · ` : ''}{amb.clics_30j ?? 0} clic{(amb.clics_30j ?? 0) > 1 ? 's' : ''} (30 j) · {eur(resteAVerser(amb))} à verser
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-gray-700" />
      </Link>
    );
  }

  if (!invite) return null;
  return (
    <Link to="/devenir-ambassadeur" className={verre} data-testid="garage-devenir-ambassadeur">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-green-700 border border-white/60">
        <Megaphone className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black uppercase tracking-tight text-gray-900">Tu fais du contenu ?</span>
        <span className="block text-sm text-gray-700">Deviens ambassadeur : ton code perso, 10 % sur chaque vente</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-gray-700" />
    </Link>
  );
}
