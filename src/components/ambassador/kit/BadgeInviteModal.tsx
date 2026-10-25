import { useEffect, useState } from 'react';
import RiderBadgeIaDialog from '@/components/garage/RiderBadgeIaDialog';
import BadgeInvite from './BadgeInvite';
import { marquerInviteVue, type ContexteInvite } from './badgeInviteEtat';

/* Invitation à créer son badge IA (25/10/2026, choix de Nolan : proposition 2 « Avant/après »).
   Affichée UNE fois par appareil et par moment : à l'ouverture de l'espace ambassadeur sans badge,
   et juste après la création de la carte Rider (BadgeInviteGate). « Créer mon badge » ouvre le vrai dialogue IA. */

export const VARIANTE_INVITE = 2;
export const EXEMPLE_BADGE = '/kit/badge-exemple.webp';

type Props = { contexte: ContexteInvite; onFin?: () => void };

const BadgeInviteModal = ({ contexte, onFin }: Props) => {
  const [invite, setInvite] = useState(true);
  const [dialogue, setDialogue] = useState(false);

  // Vue = marquée dès l'affichage : on ne la remontre pas, même si la personne quitte la page sans répondre.
  useEffect(() => { marquerInviteVue(contexte); }, [contexte]);

  return (
    <>
      {invite && (
        <div role="dialog" aria-modal="true" aria-label="Crée ton badge rider"
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/45 p-4 pb-24 sm:pb-4"
          onClick={() => { setInvite(false); onFin?.(); }}>
          <div onClick={(e) => e.stopPropagation()}>
            <BadgeInvite v={VARIANTE_INVITE} exemple={EXEMPLE_BADGE} contexte={contexte}
              onCreer={() => { setInvite(false); setDialogue(true); }}
              onPlusTard={() => { setInvite(false); onFin?.(); }} />
          </div>
        </div>
      )}
      <RiderBadgeIaDialog open={dialogue} onOpenChange={(o) => { setDialogue(o); if (!o) onFin?.(); }} />
    </>
  );
};

export default BadgeInviteModal;
