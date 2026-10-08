/**
 * Interrupteur de pré-lancement de la boutique.
 *
 * false = boutique fermée : le site reste visitable, mais aucun ajout au
 * panier, /panier et /checkout renvoient vers la pop-up « carte Rider ».
 * true  = boutique ouverte (comportement normal).
 *
 * Pour ouvrir le shop : passer à true, commit, publier.
 * Le garde-fou serveur (create-checkout-session) lit le secret SHOP_OPEN :
 * le passer aussi à "true" côté Supabase au même moment.
 */
export const SHOP_OPEN = false;

/** Remise offerte aux Riders inscrits avant l'ouverture. */
export const RIDER_LAUNCH_OFFER = {
  percent: 20,
  maxEuros: 30,
  validityDays: 60,
} as const;

/** Événement global pour ouvrir la pop-up de pré-lancement. */
export const PRELAUNCH_EVENT = 'pt:prelaunch-open';

export const openPrelaunch = () => {
  window.dispatchEvent(new Event(PRELAUNCH_EVENT));
};
